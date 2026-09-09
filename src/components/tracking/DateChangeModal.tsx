import React, { useState } from 'react'
import { X, Calendar, Check } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderDeliveryDate } from '../../api/orders'

interface DateChangeModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  currentDate: string | null | undefined
  onSaveDate: (newDate: string) => void
}

export const DateChangeModal: React.FC<DateChangeModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  currentDate,
  onSaveDate,
}) => {
  // Inicializamos con la fecha actual o vacío
  const initialDateStr = currentDate ? currentDate.substring(0, 10) : ''
  const [dateInput, setDateInput] = useState(initialDateStr)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateInput.trim()) {
      toast.error('Por favor selecciona una fecha válida')
      return
    }

    setIsSaving(true)
    const success = await updateOrderDeliveryDate(orderNumber, dateInput)
    setIsSaving(false)

    if (success) {
      onSaveDate(dateInput)
      toast.success('¡Fecha de entrega actualizada exitosamente!')
      onClose()
    } else {
      toast.error('Hubo un error al actualizar la fecha. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Cambiar Fecha de Entrega</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Nueva Fecha
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-glow-blue hover:bg-brand-lightBlue flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Fecha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
