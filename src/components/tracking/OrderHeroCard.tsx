import React from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type { CustomerOrder } from '../../types'
import { StatusStepper } from './StatusStepper'
import { triggerRewardConfetti } from '../../lib/confetti'
import { useTelemetry } from '../../context/TelemetryContext'

interface OrderHeroCardProps {
  order: CustomerOrder
  onOpenAddressModal?: () => void
  onOpenRescheduleModal?: () => void
  onOpenInvoiceModal?: () => void
  onConfirmOrder?: () => void
}

export const OrderHeroCard: React.FC<OrderHeroCardProps> = ({
  order,
  onOpenAddressModal,
  onOpenRescheduleModal,
  onOpenInvoiceModal,
  onConfirmOrder,
}) => {
  const { trackEvent } = useTelemetry()

  const handleConfirmClick = () => {
    triggerRewardConfetti()
    trackEvent('delivery_confirmed', { order_id: order.numero_pedido }, order.id)
    if (onConfirmOrder) onConfirmOrder()
  }

  const isDeliveryDay = order.cx_status === 'in_transit' || order.cx_status === 'scheduled_for_dispatch'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl glass-card bg-card border border-border/80 dark:border-white/10 p-5 shadow-lg relative overflow-hidden"
    >
      {/* Top Banner & Order Number */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-brand-blue dark:text-brand-lightBlue">
              Pedido Activo
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {order.estado_pago || 'Pagado 100%'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mt-0.5">
            #{order.numero_pedido}
          </h2>
        </div>

        <button
          onClick={() => {
            trackEvent('invoice_download', { order_id: order.numero_pedido }, order.id)
            onOpenInvoiceModal?.()
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground border border-border transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-brand-blue" />
          <span>Factura</span>
        </button>
      </div>

      {/* Stepper Progress */}
      <StatusStepper status={order.cx_status} className="my-3" />

      {/* Dynamic ETA Pill */}
      <div className="my-4 p-3.5 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 border border-brand-blue/30 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 shadow-glow-blue mt-0.5">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">Fecha Estimada de Entrega</h4>
            <span className="text-[10px] font-semibold text-brand-blue dark:text-brand-lightBlue">
              {order.promesa || 'Compromiso Only'}
            </span>
          </div>
          <p className="text-xs text-foreground/90 font-medium mt-0.5">
            {order.eta_texto || 'Tu pedido está siendo preparado con amor y precisión.'}
          </p>
        </div>
      </div>

      {/* Items Preview */}
      <div className="space-y-2.5 my-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
          <span>Productos en este pedido ({order.items.length})</span>
          <span className="font-mono text-[11px]">{order.linea}</span>
        </div>

        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.referencia}
                className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-muted-foreground shrink-0">
                <Package className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-foreground truncate">{item.referencia}</h5>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <span>Cant: <strong className="text-foreground">{item.cantidad}</strong></span>
                {item.tipo_pata && <span>• {item.tipo_pata}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address & Self-Service CTAs */}
      <div className="pt-3 border-t border-border/60 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Dirección de Entrega:</p>
              <p className="text-muted-foreground leading-snug">{order.direccion || 'Sin dirección registrada'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              trackEvent('address_change_started', { order_id: order.numero_pedido }, order.id)
              onOpenAddressModal?.()
            }}
            className="text-xs text-brand-blue dark:text-brand-lightBlue font-bold hover:underline shrink-0"
          >
            Cambiar
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onOpenRescheduleModal}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all active:scale-98"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-blue" />
            <span>Reprogramar</span>
          </button>

          <button
            onClick={handleConfirmClick}
            disabled={order.is_confirmed_by_customer}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-98 ${
              order.is_confirmed_by_customer
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : 'bg-brand-blue hover:bg-brand-lightBlue text-white shadow-glow-blue'
            }`}
          >
            {order.is_confirmed_by_customer ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmado ✓</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Confirmar Pedido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
