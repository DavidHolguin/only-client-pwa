import React, { useState } from 'react'
import { X, MapPin, Navigation, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerAuth } from '../../context/AuthContext'

interface AddressChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentAddress: string
  onSaveAddress: (newAddress: string, notes?: string) => void
}

export const AddressChangeModal: React.FC<AddressChangeModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
}) => {
  const { customer } = useCustomerAuth()
  const [addressInput, setAddressInput] = useState(currentAddress)
  const [notesInput, setNotesInput] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  if (!isOpen) return null

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = pos.coords.latitude.toFixed(4)
        const lng = pos.coords.longitude.toFixed(4)
        setAddressInput(`Ubicación GPS: ${lat}, ${lng} (Medellín, Antioquia)`)
        toast.success('Ubicación GPS detectada con precisión 📍')
      },
      (err) => {
        setIsLocating(false)
        toast.error('No se pudo acceder a tu ubicación. Por favor escribe tu dirección.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressInput.trim()) {
      toast.error('Por favor ingresa una dirección válida')
      return
    }
    onSaveAddress(addressInput.trim(), notesInput.trim())
    toast.success('¡Dirección de entrega actualizada exitosamente!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Cambiar Dirección de Entrega</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Quick Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center justify-center gap-2 border border-border transition-colors"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          ) : (
            <Navigation className="w-4 h-4 text-brand-blue" />
          )}
          <span>{isLocating ? 'Detectando GPS...' : 'Usar mi ubicación GPS actual'}</span>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Dirección Completa
            </label>
            <textarea
              rows={2}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Ej: Carrera 43A #1-50, Apto 902, Torre 1"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Indicaciones de Entrega (Opcional)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Ej: Dejar en portería / Hay ascensor de carga"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
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
              <span>Guardar Dirección</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
