import React, { useState } from 'react'
import { X, Camera, Upload, Sparkles, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { triggerRewardConfetti } from '../../lib/confetti'
import { useCustomerAuth } from '../../context/AuthContext'
import { useTelemetry } from '../../context/TelemetryContext'

interface UgcPhotoUploaderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessAward: (points: number) => void
}

const PRESET_UGC_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&auto=format&fit=crop&q=80',
]

export const UgcPhotoUploaderModal: React.FC<UgcPhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  onSuccessAward,
}) => {
  const { customer, updateProfile } = useCustomerAuth()
  const { trackEvent } = useTelemetry()
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_UGC_IMAGES[0])
  const [caption, setCaption] = useState('¡Quedó espectacular en nuestra sala! Mil gracias a Only Home 🛋️❤️')
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      setSelectedImage(previewUrl)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    setTimeout(() => {
      setIsUploading(false)
      const awarded = 1000
      if (customer) {
        updateProfile({ total_points: customer.total_points + awarded })
      }
      onSuccessAward(awarded)
      triggerRewardConfetti()
      trackEvent('ugc_uploaded', { caption, points: awarded })
      toast.success(`🎉 ¡Foto aprobada con éxito! Has ganado +${awarded.toLocaleString()} Puntos Only.`)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Sube Foto de tu Mueble</h3>
              <span className="text-[11px] font-bold text-gold font-mono">+1.000 Puntos Only</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Preview Container */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Foto de tu Producto en Casa
            </label>
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-brand-blue/40 bg-secondary/30 aspect-video flex flex-col items-center justify-center group">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Toca para seleccionar o tomar foto</span>
                </div>
              )}

              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1.5">
                <Upload className="w-4 h-4" />
                <span>Cambiar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Demo Gallery */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground">O elige un ejemplo:</span>
              {PRESET_UGC_IMAGES.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img ? 'border-brand-blue scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Tu Comentario o Historia
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="¿Qué tal quedó en tu espacio? ¿Cómo combina con tu decoración?"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-lightBlue text-white text-xs font-bold shadow-glow-blue flex items-center gap-1.5 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subiendo y Aprobando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Publicar & Ganar +1.000 Pts</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
