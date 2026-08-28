import React, { useState, useEffect } from "react"
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, AlertCircle, ChevronRight, Download,
  ShieldCheck, ExternalLink, MessageCircle, RefreshCw, PackageCheck, UserCheck, LayoutGrid,
} from "lucide-react"
import { getOrderByNumber, getOrdersByPhone } from "../api/orders"
import type { CustomerOrder } from "../types"
import { useCustomerAuth } from "../context/AuthContext"
import { OrderHeroCard } from "../components/tracking/OrderHeroCard"
import { LiveTrackingMap } from "../components/tracking/LiveTrackingMap"
import { AddressChangeModal } from "../components/tracking/AddressChangeModal"
import { RescheduleModal } from "../components/tracking/RescheduleModal"
import { OrderInvoiceModal } from "../components/orders/OrderInvoiceModal"
import { PwaInstallPrompt } from "../components/shell/PwaInstallPrompt"
import { FloatingBottomDock } from "../components/shell/FloatingBottomDock"
import { ProductImage } from "../components/common/ProductImage"

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
  const navigate = useNavigate()
  const { customer } = useCustomerAuth()

  const phoneFromUrl = (searchParams.get("phone") || searchParams.get("ph") || "").replace(/\D/g, "")

  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [otherOrders, setOtherOrders] = useState<CustomerOrder[]>([])
  const [resolvedPhone, setResolvedPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  useEffect(() => {
    if (!paramNumero) { setLoading(false); return }

    let activePhone = phoneFromUrl || customer?.phone || ""
    if (activePhone) {
      savePortalSession(paramNumero, activePhone)
    } else {
      const saved = loadPortalSession(paramNumero)
      if (saved) {
        activePhone = saved.phone
      }
    }
    setResolvedPhone(activePhone)

    getOrderByNumber(paramNumero).then(async (fetchedOrder) => {
      setOrder(fetchedOrder)
      if (fetchedOrder) {
        localStorage.setItem('last_active_order_number', fetchedOrder.numero_pedido)
      }
      const phoneToQuery = activePhone || fetchedOrder?.cliente_telefonos?.[0] || ""
      if (phoneToQuery) {
        try {
          const all = await getOrdersByPhone(phoneToQuery)
          setOtherOrders(all.filter((o) => o.numero_pedido !== paramNumero))
        } catch { /* non critical */ }
      }
      setLoading(false)
    })
  }, [paramNumero, phoneFromUrl, customer?.phone])

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
        <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
        <span className="text-xs font-mono">Cargando información del pedido...</span>
      </div>
    </div>
  )

  // Order not found state
  if (!order) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
        <img src="/logoIconoOH.jpg" alt="Only Home" className="w-10 h-10 rounded-xl object-cover" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-extrabold text-foreground">Pedido en preparación</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          El pedido <strong className="text-foreground">#{paramNumero}</strong> aún se está registrando en el sistema. En unos minutos podrás ver toda la información aquí.
        </p>
      </div>
      <div className="w-full space-y-2.5 max-w-xs">
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm transition-all active:scale-95 shadow-md shadow-brand-blue/20">
          <RefreshCw className="w-4 h-4" />Actualizar ahora
        </button>
        <a href="https://wa.me/573127959474" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full justify-center py-3 rounded-2xl bg-white border border-border text-foreground font-bold text-sm transition-all hover:bg-secondary/60">
          <MessageCircle className="w-4 h-4 text-emerald-500" />Contactar Soporte
        </a>
      </div>
    </div>
  )

  const statusInfo = getStatusInfo(order.cx_status)
  const isDeliveryDay = order.cx_status === "in_transit" || order.cx_status === "scheduled_for_dispatch"

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative overflow-x-hidden">

      {/* Minimal clean header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-border/60 shadow-xs">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
              <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {order.cliente_nombre ? `Hola, ${order.cliente_nombre.split(' ')[0]}` : 'Pedido Only'}
              </p>
              <p className="text-xs font-extrabold text-foreground leading-none">Pedido #{order.numero_pedido}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/80 border border-border text-xs font-bold ${statusInfo.color}`}>
              <span>{statusInfo.emoji}</span>
              <span>{statusInfo.label}</span>
            </div>
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

      {/* Main Order Content */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-36">
        <OrderHeroCard
          order={order}
          onOpenAddressModal={() => setIsAddressModalOpen(true)}
          onOpenRescheduleModal={() => setIsRescheduleModalOpen(true)}
          onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
        />

        {/* Other orders from same customer */}
        {otherOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-3xl bg-card border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Tus otros pedidos</h3>
              <Link to="/pedidos" className="text-[11px] font-bold text-brand-blue dark:text-brand-lightBlue hover:underline flex items-center gap-0.5">
                Ver todos ({otherOrders.length + 1}) <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {otherOrders.slice(0, 3).map((o) => {
                const s = getStatusInfo(o.cx_status)
                const firstItem = o.items?.[0]
                const itemImg = o.imagen_url || firstItem?.image_url
                return (
                  <Link key={o.id} to={`/p/${o.numero_pedido}?phone=${resolvedPhone}`} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/40 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductImage
                        src={itemImg}
                        alt={firstItem?.referencia || `Pedido #${o.numero_pedido}`}
                        containerClassName="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-border/50 bg-white dark:bg-slate-900 shadow-2xs relative flex items-center justify-center"
                        iconSize="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">Pedido #{o.numero_pedido}</p>
                        <p className={`text-[11px] font-medium ${s.color}`}>{s.emoji} {s.label}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Help + Invoice actions */}
        <div className="p-4 rounded-3xl bg-card border border-border/60 space-y-3">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Servicio al cliente</h3>
          <div className="grid grid-cols-2 gap-2">
            <a href="https://wa.me/573127959474" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all active:scale-95">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 text-center">Chatear con Asesor</span>
            </a>
            <button onClick={() => setIsInvoiceModalOpen(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/25 transition-all active:scale-95">
              <Download className="w-5 h-5 text-brand-blue dark:text-brand-lightBlue" />
              <span className="text-[10px] font-bold text-brand-blue dark:text-brand-lightBlue text-center">Descargar Factura</span>
            </button>
          </div>
        </div>

        <PwaInstallPrompt />
      </main>

      {/* Floating Bottom Navigation Dock */}
      <FloatingBottomDock />

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
