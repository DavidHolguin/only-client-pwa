import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, FileText, CheckCircle2, Truck, Clock, ChevronRight, Star } from 'lucide-react'
import { SAMPLE_ORDERS } from '../lib/mockData'
import type { CustomerOrder } from '../types'
import { OrderInvoiceModal } from '../components/orders/OrderInvoiceModal'
import { ReviewOrderModal } from '../components/club/ReviewOrderModal'

export const OrdersPage: React.FC = () => {
  const [orders] = useState<CustomerOrder[]>(SAMPLE_ORDERS)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null)
  const [reviewOrderTarget, setReviewOrderTarget] = useState<CustomerOrder | null>(null)

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return o.cx_status !== 'delivered'
    if (filter === 'delivered') return o.cx_status === 'delivered'
    return true
  })

  return (
    <div className="space-y-4 px-4 pb-36">
      {/* Header Title */}
      <div className="pt-2">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Mis Pedidos & Facturas
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Consulta el historial de tus compras y descarga tus facturas DIAN.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/60">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'En Progreso' },
          { id: 'delivered', label: 'Entregados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-card text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isDelivered = order.cx_status === 'delivered'

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl glass-card bg-card border border-border/80 shadow-sm space-y-3"
            >
              {/* Order Top Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Pedido Only</span>
                  <h3 className="text-sm font-extrabold text-foreground">#{order.numero_pedido}</h3>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isDelivered
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-brand-blue/15 text-brand-blue dark:text-brand-lightBlue border-brand-blue/30'
                  }`}
                >
                  {isDelivered ? 'Entregado ✓' : 'En Ruta 🚚'}
                </span>
              </div>

              {/* Items Preview */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.referencia}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {order.linea} • Cant: {item.cantidad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & CTAs */}
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">
                  {order.fecha_creacion}
                </span>

                <div className="flex items-center gap-2">
                  {isDelivered && (
                    <button
                      onClick={() => setReviewOrderTarget(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 text-gold text-xs font-bold border border-gold/30 flex items-center gap-1 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-gold" />
                      <span>Calificar</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Factura</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />
      )}

      {/* Review Modal */}
      {reviewOrderTarget && (
        <ReviewOrderModal
          isOpen={!!reviewOrderTarget}
          onClose={() => setReviewOrderTarget(null)}
          onSuccessAward={() => {}}
        />
      )}
    </div>
  )
}
