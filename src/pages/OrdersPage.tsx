import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, FileText, CheckCircle2, Truck, Clock, ChevronRight, Star, Loader2 } from 'lucide-react'
import { getOrdersByPhone } from '../api/orders'
import { useCustomerAuth } from '../context/AuthContext'
import type { CustomerOrder } from '../types'
import { OrderInvoiceModal } from '../components/orders/OrderInvoiceModal'
import { ReviewOrderModal } from '../components/club/ReviewOrderModal'
import { ProductImage } from '../components/common/ProductImage'

export const OrdersPage: React.FC = () => {
  const { customer } = useCustomerAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null)
  const [reviewOrderTarget, setReviewOrderTarget] = useState<CustomerOrder | null>(null)

  useEffect(() => {
    let isMounted = true
    if (customer?.phone) {
      getOrdersByPhone(customer.phone).then((data) => {
        if (isMounted) {
          setOrders(data)
          setLoading(false)
        }
      })
    } else {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [customer?.phone])

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return o.cx_status !== 'delivered'
    if (filter === 'delivered') return o.cx_status === 'delivered'
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Entregado ✓', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'in_transit':
        return { label: 'En Ruta 🚚', className: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'ready_for_dispatch':
        return { label: 'Listo Despacho 📦', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      case 'in_production':
        return { label: 'En Fabricación 🔨', className: 'bg-amber-50 text-amber-700 border-amber-200' }
      default:
        return { label: 'En Proceso ⏳', className: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
  }

  const handleOrderClick = (numeroPedido: string) => {
    localStorage.setItem('last_active_order_number', numeroPedido)
    navigate(`/p/${numeroPedido}`)
  }

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
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/80 border border-border/80">
        {[
          { id: 'all', label: `Todos (${orders.length})` },
          { id: 'active', label: 'En Progreso' },
          { id: 'delivered', label: 'Entregados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-white text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Cargando tus pedidos...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="py-12 px-6 rounded-3xl bg-white border border-border text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No tienes pedidos en esta sección</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Todos tus pedidos registrados en Only Home aparecerán aquí con su estado y factura.
          </p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isDelivered = order.cx_status === 'delivered'
          const badge = getStatusBadge(order.cx_status)

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleOrderClick(order.numero_pedido)}
              className="p-4 rounded-3xl bg-white border border-border/80 shadow-xs space-y-3 cursor-pointer hover:border-brand-blue/40 transition-colors"
            >
              {/* Order Top Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Pedido Only</span>
                  <h3 className="text-sm font-extrabold text-foreground">#{order.numero_pedido}</h3>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              {/* Items Preview */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-2xl bg-secondary/30 border border-border/30">
                    <ProductImage
                      src={item.image_url}
                      alt={item.referencia}
                      containerClassName="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-border/50 bg-white dark:bg-slate-900 shadow-2xs relative flex items-center justify-center"
                      iconSize="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.referencia}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {order.linea || 'MUEBLES'} • Cant: <strong className="text-foreground">{item.cantidad}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer & CTAs */}
              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {order.fecha_creacion || 'Registrado'}
                </span>

                <div className="flex items-center gap-2">
                  {isDelivered && (
                    <button
                      onClick={() => setReviewOrderTarget(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
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

                  <button
                    onClick={() => handleOrderClick(order.numero_pedido)}
                    className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                    aria-label="Ver seguimiento"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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

