import React, { useState } from 'react'
import { X, MapPin, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomerAddress } from '../../types'

interface AddressManagerModalProps {
  isOpen: boolean
  onClose: () => void
  addresses: CustomerAddress[]
  onSaveAddress: (newAddr: CustomerAddress) => void
}

export const AddressManagerModal: React.FC<AddressManagerModalProps> = ({
  isOpen,
  onClose,
  addresses,
  onSaveAddress,
}) => {
  const [alias, setAlias] = useState('Casa')
  const [formattedAddress, setFormattedAddress] = useState('')
  const [city, setCity] = useState('Medellín')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formattedAddress.trim()) {
      toast.error('Por favor escribe la dirección completa')
      return
    }

    const newAddressItem: CustomerAddress = {
      id: 'addr-' + Date.now(),
      alias,
      formatted_address: formattedAddress.trim(),
      city,
      delivery_notes: deliveryNotes.trim() || undefined,
      is_default: addresses.length === 0,
    }

    onSaveAddress(newAddressItem)
    toast.success('¡Nueva dirección guardada en tu libreta!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Agregar Nueva Dirección</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Nombre de la Ubicación
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Apartamento, Casa Campestre, Oficina"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Dirección Completa
            </label>
            <textarea
              rows={2}
              value={formattedAddress}
              onChange={(e) => setFormattedAddress(e.target.value)}
              placeholder="Ej: Calle 10 #43E-20, Edificio Palma Real Apto 402"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Notas Portería
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ej: Ascensor carga"
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
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
              <span>Guardar Dirección</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
