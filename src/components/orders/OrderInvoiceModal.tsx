import React from 'react'
import { X, FileText, Download, ShieldCheck, CheckCircle2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomerOrder } from '../../types'

interface OrderInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: CustomerOrder
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen) return null

  const handleDownload = () => {
    toast.success('Descargando factura electrónica DIAN (PDF)...')
    // Opens mock PDF
    window.open(order.invoice_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')
  }

  const formatCOP = (num?: number) => {
    if (!num) return '$0 COP'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Factura Electrónica</h3>
              <p className="text-[11px] font-mono text-muted-foreground">CUFE: FE-ONLY-99824-2026</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DIAN Badge */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-500 font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Validada por DIAN • Only Home S.A.S. (NIT 901.482.910-4)</span>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-secondary/40 border border-border/50 font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">No. Pedido</span>
            <strong className="text-foreground">#{order.numero_pedido}</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Fecha Emisión</span>
            <strong className="text-foreground">{order.fecha_creacion || '2026-08-05'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Cliente</span>
            <strong className="text-foreground truncate block">{order.cliente_nombre}</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Estado de Pago</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {order.estado_pago || 'Pagado 100%'}
            </span>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground">Detalle de Conceptos</h4>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-background border border-border">
                <div>
                  <p className="font-bold text-foreground">{item.referencia}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">SKU: {item.sku} • Cant: {item.cantidad}</p>
                </div>
                <span className="font-bold font-mono text-foreground">{formatCOP(order.total_amount ? order.total_amount / order.items.length : 1725000)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Calculation */}
        <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/60 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal Antes de IVA</span>
            <span>{formatCOP(order.total_amount ? order.total_amount * 0.84 : 2899160)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>IVA (19%)</span>
            <span>{formatCOP(order.total_amount ? order.total_amount * 0.16 : 550840)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Envío e Instalación</span>
            <span className="text-emerald-500 font-bold">GRATIS</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between font-bold text-sm text-foreground">
            <span>Total Pagado</span>
            <span className="text-brand-blue dark:text-brand-lightBlue">{formatCOP(order.total_amount || 3450000)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80"
          >
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-glow-blue hover:bg-brand-lightBlue flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}
