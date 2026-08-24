import React, { useState } from 'react'
import { X, Calendar, Clock, Check } from 'lucide-react'
import { toast } from 'sonner'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  currentDate?: string | null
  onSaveDate: (newDate: string, timeSlot: string) => void
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Mañana (8:00 AM - 12:30 PM)' },
  { id: 'afternoon', label: 'Tarde (1:30 PM - 6:00 PM)' },
  { id: 'anytime', label: 'Cualquier horario del día' },
]

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSaveDate,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-08-28')
  const [selectedSlot, setSelectedSlot] = useState('morning')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveDate(selectedDate, selectedSlot)
    toast.success(`¡Entrega reprogramada con éxito para el ${selectedDate}!`)
    onClose()
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
            <h3 className="text-sm font-bold text-foreground">Reprogramar Fecha de Entrega</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Nueva Fecha Deseada
            </label>
            <input
              type="date"
              min="2026-08-25"
              max="2026-09-30"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Franja Horaria Preferida
            </label>
            <div className="space-y-1.5">
              {TIME_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedSlot === slot.id
                      ? 'bg-brand-blue/10 border-brand-blue text-brand-blue font-bold'
                      : 'bg-background border-border text-muted-foreground hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.label}</span>
                  </div>
                  {selectedSlot === slot.id && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-glow-blue hover:bg-brand-lightBlue flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar Reprogramación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
