import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Camera, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useCustomerAuth } from '../context/AuthContext'
import { useTelemetry } from '../context/TelemetryContext'
import { SAMPLE_ORDERS } from '../lib/mockData'
import { getOrderByNumber } from '../api/orders'
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

    const targetNumber = activeNumber || SAMPLE_ORDERS[0].numero_pedido

    getOrderByNumber(targetNumber).then((fetchedOrder) => {
      if (isMounted) {
        setOrder(fetchedOrder || SAMPLE_ORDERS[0])
        setLoading(false)
        if (fetchedOrder) {
          trackEvent('order_tracking_view', { numero_pedido: fetchedOrder.numero_pedido }, fetchedOrder.id)
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [activeNumber])

  if (loading || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        <p className="text-xs font-mono text-muted-foreground animate-pulse">
          Consultando estado de tu pedido...
        </p>
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
