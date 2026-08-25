import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Camera, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useCustomerAuth } from '../context/AuthContext'
import { useTelemetry } from '../context/TelemetryContext'
import { SAMPLE_ORDERS } from '../lib/mockData'
import { getOrderByNumber, getOrdersByPhone } from '../api/orders'
import type { CustomerOrder } from '../types'
import { OrderHeroCard } from '../components/tracking/OrderHeroCard'
import { LiveTrackingMap } from '../components/tracking/LiveTrackingMap'
import { AddressChangeModal } from '../components/tracking/AddressChangeModal'
import { RescheduleModal } from '../components/tracking/RescheduleModal'
import { OrderInvoiceModal } from '../components/orders/OrderInvoiceModal'
import { UgcPhotoUploaderModal } from '../components/club/UgcPhotoUploaderModal'
import { PwaInstallPrompt } from '../components/shell/PwaInstallPrompt'

export const TrackingPage: React.FC = () => {
  const { numero_pedido: paramNumero } = useParams<{ numero_pedido?: string }>()
  const [searchParams] = useSearchParams()
  const queryNumero = searchParams.get('pedido') || searchParams.get('n')
  const activeNumber = paramNumero || queryNumero

  const { customer } = useCustomerAuth()
  const { trackEvent } = useTelemetry()
  const navigate = useNavigate()

  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isUgcModalOpen, setIsUgcModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const resolveAndFetchOrder = async () => {
      // 1. Número específico por URL
      let targetNumber = activeNumber

      // 2. Si no viene en URL, revisar último pedido consultado en este dispositivo
      if (!targetNumber) {
        targetNumber = localStorage.getItem('last_active_order_number') || ''
      }

      // 3. Si aún no hay número, buscar los pedidos del cliente autenticado
      if (!targetNumber && customer?.phone) {
        try {
          const customerOrders = await getOrdersByPhone(customer.phone)
          if (customerOrders.length > 0) {
            targetNumber = customerOrders[0].numero_pedido
          }
        } catch (e) {
          console.warn('Error fetching customer orders in TrackingPage', e)
        }
      }

      if (targetNumber) {
        try {
          const fetched = await getOrderByNumber(targetNumber)
          if (isMounted) {
            if (fetched) {
              setOrder(fetched)
              localStorage.setItem('last_active_order_number', fetched.numero_pedido)
              trackEvent('order_tracking_view', { numero_pedido: fetched.numero_pedido }, fetched.id)
            } else if (customer?.phone) {
              // Si el número guardado falló, intentar con el primer pedido real del cliente
              const allOrders = await getOrdersByPhone(customer.phone)
              if (allOrders.length > 0) {
                setOrder(allOrders[0])
                localStorage.setItem('last_active_order_number', allOrders[0].numero_pedido)
              } else {
                setOrder(null)
              }
            } else {
              setOrder(null)
            }
          }
        } catch (err) {
          if (isMounted) setOrder(null)
        }
      } else {
        if (isMounted) setOrder(null)
      }

      if (isMounted) setLoading(false)
    }

    resolveAndFetchOrder()

    return () => {
      isMounted = false
    }
  }, [activeNumber, customer?.phone])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
          <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">Consultando estado de tu pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-secondary/70 flex items-center justify-center text-muted-foreground border border-border">
          <img src="/logoIconoOH.jpg" alt="Only Home" className="w-10 h-10 rounded-xl object-cover" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-foreground">No tienes pedidos en curso</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Cuando realices una compra en Only Home o abras el enlace de WhatsApp de tu pedido, aquí podrás ver en tiempo real la fabricación y entrega.
          </p>
        </div>
        <div className="pt-2 w-full space-y-2">
          <a
            href="https://onlyhome.co"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs shadow-md transition-all active:scale-95 text-center"
          >
            Explorar Catálogo Only Home
          </a>
          <a
            href="https://wa.me/573127959474"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all text-center"
          >
            Hablar con un Asesor
          </a>
        </div>
      </div>
    )
  }

  const isDeliveryDay = order.cx_status === 'in_transit' || order.cx_status === 'scheduled_for_dispatch'

  const handleSaveAddress = (newAddr: string) => {
    setOrder((prev) => (prev ? { ...prev, direccion: newAddr } : null))
  }

  const handleSaveDate = (newDate: string, slot: string) => {
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            fecha_entrega_prom: newDate,
            eta_texto: `Reprogramado para el ${newDate} (${slot === 'morning' ? 'Mañana' : 'Tarde'})`,
          }
        : null
    )
  }

  const handleConfirmOrder = () => {
    setOrder((prev) => (prev ? { ...prev, is_confirmed_by_customer: true } : null))
  }

  return (
    <div className="space-y-4 pb-36">
      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Conditional Live Tracking Map (Only appears on Delivery Day / In Transit) */}
      {isDeliveryDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="px-4"
        >
          <LiveTrackingMap
            driver={order.driver}
            destinationAddress={order.direccion || 'Medellín'}
          />
        </motion.div>
      )}

      {/* Main Order Card */}
      <div className="px-4">
        <OrderHeroCard
          order={order}
          onOpenAddressModal={() => setIsAddressModalOpen(true)}
          onOpenRescheduleModal={() => setIsRescheduleModalOpen(true)}
          onOpenInvoiceModal={() => setIsInvoiceModalOpen(true)}
          onConfirmOrder={handleConfirmOrder}
        />
      </div>

      {/* Gamification Incentive Banner */}
      <div className="px-4">
        <div
          onClick={() => setIsUgcModalOpen(true)}
          className="p-4 rounded-3xl bg-gradient-to-r from-gold/20 via-amber-500/15 to-gold/10 border border-gold/40 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-glow-gold"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Misión Only Club
                </h4>
                <span className="px-1.5 py-0.2 rounded bg-gold text-slate-950 text-[9px] font-extrabold">
                  +1.000 PTS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                Sube una foto cuando recibas tu mueble y gana bonos para tu hogar.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gold shrink-0" />
        </div>
      </div>

      {/* Secondary Quick Access Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <div
          onClick={() => navigate('/club')}
          className="p-3.5 rounded-2xl glass-card bg-card border border-border flex items-center gap-2.5 cursor-pointer hover:border-brand-blue/50 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold block">Tus Puntos</span>
            <strong className="text-xs font-mono text-gold font-bold">
              {customer?.total_points ? customer.total_points.toLocaleString() : '1.750'} pts
            </strong>
          </div>
        </div>

        <div
          onClick={() => navigate('/pedidos')}
          className="p-3.5 rounded-2xl glass-card bg-card border border-border flex items-center gap-2.5 cursor-pointer hover:border-brand-blue/50 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold block">Historial</span>
            <strong className="text-xs text-foreground font-bold">Ver Pedidos</strong>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddressChangeModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentAddress={order.direccion || ''}
        onSaveAddress={handleSaveAddress}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        currentDate={order.fecha_entrega_prom}
        onSaveDate={handleSaveDate}
      />

      <OrderInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={order}
      />

      <UgcPhotoUploaderModal
        isOpen={isUgcModalOpen}
        onClose={() => setIsUgcModalOpen(false)}
        onSuccessAward={() => {}}
      />
    </div>
  )
}
