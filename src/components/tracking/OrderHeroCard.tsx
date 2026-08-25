import React from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  Building
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

  const getPaymentBadge = () => {
    if (!order.estado_pago) return null
    const lower = order.estado_pago.toLowerCase()
    if (lower.includes('anticipo')) {
      return { label: order.estado_pago, className: 'bg-amber-50 text-amber-700 border-amber-200' }
    }
    if (lower.includes('pago') || lower.includes('100') || lower.includes('total') || lower.includes('cancelado')) {
      return { label: order.estado_pago, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    }
    return { label: order.estado_pago, className: 'bg-slate-50 text-slate-700 border-slate-200' }
  }

  const paymentBadge = getPaymentBadge()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      {/* Main Order Status & Stepper Card */}
      <div className="w-full rounded-3xl bg-white border border-border/80 p-5 shadow-sm relative overflow-hidden space-y-4">
        {/* Top Banner & Order Number */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-brand-blue">
                Pedido Activo
              </span>
              {paymentBadge && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${paymentBadge.className}`}>
                  {paymentBadge.label}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">
              Pedido #{order.numero_pedido}
            </h2>
          </div>

          <button
            onClick={() => {
              trackEvent('invoice_download', { order_id: order.numero_pedido }, order.id)
              onOpenInvoiceModal?.()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground border border-border/80 transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-brand-blue" />
            <span>Factura</span>
          </button>
        </div>

        {/* Stepper Progress */}
        <StatusStepper status={order.cx_status} />

        {/* Status Message & Schedule */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-blue text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {order.eta_texto || 'Tu pedido está siendo preparado con precisión y alta calidad en nuestra planta.'}
              </p>
              {order.fecha_entrega_prom && (
                <p className="text-[11px] font-mono text-muted-foreground">
                  Fecha de entrega programada: <strong className="text-foreground">{order.fecha_entrega_prom}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Customer Information & Delivery Details Card */}
      <div className="w-full rounded-3xl glass-card bg-card border border-border/80 dark:border-white/10 p-5 shadow-lg space-y-3.5">
        <h3 className="text-xs uppercase font-black tracking-wider text-muted-foreground">
          Datos de Entrega y Cliente
        </h3>
        
        <div className="space-y-3">
          {/* Customer Name */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Cliente</p>
              <p className="text-xs font-extrabold text-foreground">{order.cliente_nombre}</p>
              {order.cliente_documento && (
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">C.C. {order.cliente_documento}</p>
              )}
            </div>
          </div>

          {/* Destination & Address */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Dirección de despacho</p>
                <p className="text-xs font-extrabold text-foreground leading-snug">{order.direccion}</p>
                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 uppercase">{order.destino}</p>
              </div>
            </div>
            <button
              onClick={() => {
                trackEvent('address_change_started', { order_id: order.numero_pedido }, order.id)
                onOpenAddressModal?.()
              }}
              className="text-xs text-brand-blue dark:text-brand-lightBlue font-bold hover:underline shrink-0 mt-1"
            >
              Cambiar
            </button>
          </div>

          {/* Store & Advisor */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
              <Building className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Tienda y Asesor</p>
              <p className="text-xs font-bold text-foreground">{order.tienda || 'Only Home'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Asesor: <strong className="text-foreground/80">{order.asesor || 'Asistente Only'}</strong></p>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
          <button
            onClick={onOpenRescheduleModal}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-blue" />
            <span>Reprogramar</span>
          </button>

          <button
            onClick={handleConfirmClick}
            disabled={order.is_confirmed_by_customer}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 ${
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

      {/* Items Preview Card */}
      <div className="w-full rounded-3xl glass-card bg-card border border-border/80 dark:border-white/10 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
          <span className="uppercase tracking-wider">Productos ({order.items.length})</span>
          <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono font-bold uppercase">{order.linea}</span>
        </div>

        <div className="space-y-2.5">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/35 border border-border/40 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-extrabold text-foreground truncate">{item.referencia}</h5>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span>Cant: <strong className="text-foreground font-bold">{item.cantidad}</strong></span>
                  {item.tipo_pata && <span>• {item.tipo_pata}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
