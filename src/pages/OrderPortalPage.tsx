import React, { useState, useEffect } from "react"
import { useParams, useSearchParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, AlertCircle, ChevronRight, Download,
  ShieldCheck, ExternalLink, MessageCircle, RefreshCw, PackageCheck,
} from "lucide-react"
import { getOrderByNumber, getOrdersByPhone } from "../api/orders"
import type { CustomerOrder } from "../types"
import { OrderHeroCard } from "../components/tracking/OrderHeroCard"
import { LiveTrackingMap } from "../components/tracking/LiveTrackingMap"
import { AddressChangeModal } from "../components/tracking/AddressChangeModal"
import { RescheduleModal } from "../components/tracking/RescheduleModal"
import { OrderInvoiceModal } from "../components/orders/OrderInvoiceModal"
import { PwaInstallPrompt } from "../components/shell/PwaInstallPrompt"

// ─── Session persistence ────────────────────────────────────────────────────
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000

interface PortalSession { phone: string; pedido: string; createdAt: string; expiresAt: string }

function savePortalSession(pedido: string, phone: string) {
  const now = Date.now()
  const s: PortalSession = { phone, pedido, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + SESSION_TTL_MS).toISOString() }
  localStorage.setItem(`only_portal_${pedido}`, JSON.stringify(s))
}

function loadPortalSession(pedido: string): PortalSession | null {
  try {
    const raw = localStorage.getItem(`only_portal_${pedido}`)
    if (!raw) return null
    const s: PortalSession = JSON.parse(raw)
    if (new Date(s.expiresAt) < new Date()) { localStorage.removeItem(`only_portal_${pedido}`); return null }
    savePortalSession(pedido, s.phone) // refresh TTL
    return s
  } catch { return null }
}

function getStatusInfo(status: string) {
  switch (status) {
    case "pending_confirmation": return { label: "Pendiente", color: "text-amber-500", emoji: "⏳" }
    case "in_production": return { label: "En Fabricación", color: "text-blue-500", emoji: "🔨" }
    case "ready_for_dispatch": return { label: "Listo para Despacho", color: "text-emerald-500", emoji: "📦" }
    case "scheduled_for_dispatch": return { label: "Despacho Programado", color: "text-indigo-500", emoji: "📋" }
    case "in_transit": return { label: "En Ruta", color: "text-brand-blue", emoji: "🚚" }
    case "delivered": return { label: "Entregado", color: "text-emerald-500", emoji: "✅" }
    case "delayed": return { label: "Con Novedad", color: "text-red-500", emoji: "⚠️" }
    default: return { label: "En Proceso", color: "text-blue-500", emoji: "🔄" }
  }
}

export const OrderPortalPage: React.FC = () => {
  const { numero_pedido: paramNumero } = useParams<{ numero_pedido?: string }>()
  const [searchParams] = useSearchParams()
  const phoneFromUrl = (searchParams.get("phone") || searchParams.get("ph") || "").replace(/\D/g, "")

  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [otherOrders, setOtherOrders] = useState<CustomerOrder[]>([])
  const [resolvedPhone, setResolvedPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  useEffect(() => {
    if (!paramNumero) { setLoading(false); return }
    let activePhone = phoneFromUrl
    if (activePhone) {
      savePortalSession(paramNumero, activePhone)
    } else {
      const saved = loadPortalSession(paramNumero)
      if (saved) { activePhone = saved.phone } else { setSessionExpired(true); setLoading(false); return }
    }
    setResolvedPhone(activePhone)
    getOrderByNumber(paramNumero).then(async (fetchedOrder) => {
      setOrder(fetchedOrder)
      if (activePhone) {
        try {
          const all = await getOrdersByPhone(activePhone)
          setOtherOrders(all.filter((o) => o.numero_pedido !== paramNumero))
        } catch { /* non critical */ }
      }
      setLoading(false)
    })
  }, [paramNumero, phoneFromUrl])

  // Loading
  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center animate-pulse">
        <span className="font-extrabold text-brand-blue text-xl tracking-tighter">OH</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-mono animate-pulse">Cargando tu pedido...</span>
      </div>
    </div>
  )

  // Session expired
  if (sessionExpired) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-extrabold text-foreground">Enlace caducado</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">Tu enlace de seguimiento expiró. Escríbenos y te enviamos el enlace actualizado.</p>
      </div>
      <a href={`https://wa.me/573127959474?text=Hola%2C+necesito+el+enlace+de+seguimiento+del+pedido+%23${paramNumero}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30">
        <MessageCircle className="w-4 h-4" /> Solicitar nuevo enlace
      </a>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="w-3 h-3 text-brand-blue" /><span>Only Home · Tu hogar en buenas manos</span></div>
    </div>
  )

  // Order not found
  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-6">
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center"><span className="font-extrabold text-brand-blue text-xs tracking-tighter">OH</span></div>
        <span className="text-xs font-bold text-muted-foreground">Only Home</span>
      </div>
      <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center"><PackageCheck className="w-8 h-8 text-muted-foreground" /></div>
      <div className="space-y-2">
        <h2 className="text-lg font-extrabold text-foreground">Pedido en preparación</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">El pedido <strong className="text-foreground">#{paramNumero}</strong> aún está siendo registrado. En unos minutos verás toda la información aquí.</p>
      </div>
      <div className="w-full space-y-2.5 max-w-xs">
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl bg-brand-blue text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-brand-blue/30"><RefreshCw className="w-4 h-4" />Actualizar ahora</button>
        <a href="https://wa.me/573127959474" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl bg-secondary border border-border text-foreground font-bold text-sm transition-all"><MessageCircle className="w-4 h-4 text-emerald-500" />Contactar Only Home</a>
      </div>
    </div>
  )

  const statusInfo = getStatusInfo(order.cx_status)
  const isDeliveryDay = order.cx_status === "in_transit" || order.cx_status === "scheduled_for_dispatch"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative overflow-x-hidden">

      {/* Minimal header */}
      <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center shrink-0"><span className="font-extrabold text-brand-blue text-xs tracking-tighter">OH</span></div>
            <div><p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Pedido Only</p><p className="text-xs font-extrabold text-foreground leading-none">#{order.numero_pedido}</p></div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-bold ${statusInfo.color}`}>
            <span>{statusInfo.emoji}</span><span>{statusInfo.label}</span>
          </div>
        </div>
      </header>

      {/* Live tracking map on delivery day */}
      <AnimatePresence>
        {isDeliveryDay && order.driver && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 220 }} exit={{ opacity: 0, height: 0 }} className="w-full overflow-hidden">
            <LiveTrackingMap
              driver={order.driver}
              destinationAddress={order.direccion || undefined}
              etaMinutes={24}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-36">
        <OrderHeroCard
          order={order}
          onOpenAddressModal={() => setIsAddressModalOpen(true)}
          onOpenRescheduleModal={() => setIsRescheduleModalOpen(true)}
          onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        />

        {/* Other orders from same phone */}
        {otherOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-3xl bg-card border border-border/60 space-y-3">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Tus otros pedidos</h3>
            <div className="space-y-2">
              {otherOrders.slice(0, 3).map((o) => {
                const s = getStatusInfo(o.cx_status)
                return (
                  <Link key={o.id} to={`/p/${o.numero_pedido}?phone=${resolvedPhone}`} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/40">
                    <div><p className="text-xs font-bold text-foreground">Pedido #{o.numero_pedido}</p><p className={`text-[11px] font-medium ${s.color}`}>{s.emoji} {s.label}</p></div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Help card */}
        <div className="p-4 rounded-3xl bg-card border border-border/60 space-y-3">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">¿Necesitas ayuda?</h3>
          <div className="grid grid-cols-2 gap-2">
            <a href="https://wa.me/573127959474" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all active:scale-95">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 text-center">Chatear con Only</span>
            </a>
            <button onClick={() => setIsInvoiceModalOpen(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/25 transition-all active:scale-95">
              <Download className="w-5 h-5 text-brand-blue dark:text-brand-lightBlue" />
              <span className="text-[10px] font-bold text-brand-blue dark:text-brand-lightBlue text-center">Descargar Factura</span>
            </button>
          </div>
        </div>

        <PwaInstallPrompt />
      </main>

      {/* Sticky bottom CTAs */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent z-30">
        <div className="flex items-center justify-between gap-3">
          <a href="https://wa.me/573127959474" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary border border-border text-foreground font-bold text-xs hover:bg-secondary/80 transition-all active:scale-95">
            <MessageCircle className="w-4 h-4 text-emerald-500" />Hablar con asesor
          </a>
          <a href="https://onlyhome.co" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs transition-all active:scale-95 shadow-lg shadow-brand-blue/25">
            <ExternalLink className="w-4 h-4" />Ver catálogo
          </a>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-brand-blue" /><span>Only Home · Portal de Clientes · Uso personal</span>
        </div>
      </div>

      {/* Modals */}
      {isAddressModalOpen && (
        <AddressChangeModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          currentAddress={order.direccion || ""}
          onSaveAddress={() => setIsAddressModalOpen(false)}
        />
      )}
      {isRescheduleModalOpen && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          currentDate={order.fecha_entrega_prom || undefined}
          onSaveDate={() => setIsRescheduleModalOpen(false)}
        />
      )}
      {isInvoiceModalOpen && (
        <OrderInvoiceModal
          order={order}
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  )
}
