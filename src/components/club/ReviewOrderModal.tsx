import React, { useState } from 'react'
import { X, Star, Sparkles, Check, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { triggerRewardConfetti } from '../../lib/confetti'
import { useCustomerAuth } from '../../context/AuthContext'
import { useTelemetry } from '../../context/TelemetryContext'

interface ReviewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessAward: (points: number) => void
}

const REVIEW_TAGS = ['Puntualidad Impecable', 'Instalación Perfecta', 'Excelente Acabado', 'Atención Amable', '100% Recomendado']

export const ReviewOrderModal: React.FC<ReviewOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccessAward,
}) => {
  const { customer, updateProfile } = useCustomerAuth()
  const { trackEvent } = useTelemetry()
  const [rating, setRating] = useState<number>(5)
  const [selectedTags, setSelectedTags] = useState<string[]>(['Puntualidad Impecable', 'Instalación Perfecta'])
  const [comment, setComment] = useState('Los transportadores llegaron a tiempo, dejaron todo instalado y limpio. Excelente experiencia.')

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const awarded = 500
    if (customer) {
      updateProfile({ total_points: customer.total_points + awarded })
    }
    onSuccessAward(awarded)
    triggerRewardConfetti()
    trackEvent('review_submitted', { rating, tags: selectedTags, comment })
    toast.success(`⭐ ¡Muchas gracias por tu calificación! Has ganado +${awarded} Puntos Only.`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
              <Star className="w-4 h-4 fill-gold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Califica tu Entrega</h3>
              <span className="text-[11px] font-bold text-gold font-mono">+500 Puntos Only</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selector */}
          <div className="flex flex-col items-center justify-center py-2 bg-secondary/30 rounded-2xl border border-border/50">
            <span className="text-[11px] text-muted-foreground font-semibold mb-2">
              ¿Cómo fue la experiencia general?
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-gold fill-gold drop-shadow-md' : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-gold mt-1">
              {rating === 5 ? '¡Excelente servicio! 🌟' : rating === 4 ? 'Muy bueno 👍' : 'Bueno 🙂'}
            </span>
          </div>

          {/* Quick Tag Pills */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Aspectos Destacados
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-gold/15 text-gold border-gold/40 font-bold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Comentarios adicionales
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos más detalles..."
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
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-slate-950 text-xs font-bold shadow-glow-gold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enviar & Ganar +500 Pts</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
