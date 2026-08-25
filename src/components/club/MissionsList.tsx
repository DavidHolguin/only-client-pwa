import React from 'react'
import { Camera, Star, Share2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'

interface MissionsListProps {
  onOpenUgcModal: () => void
  onOpenReviewModal: () => void
  onOpenReferralModal: () => void
}

export const MissionsList: React.FC<MissionsListProps> = ({
  onOpenUgcModal,
  onOpenReviewModal,
  onOpenReferralModal,
}) => {
  const missions = [
    {
      id: 'ugc',
      title: 'Sube una foto de tu mueble en casa',
      desc: 'Muestra cómo luce tu mueble Only Home y gana puntos al instante.',
      points: '+1.000 pts',
      icon: Camera,
      action: onOpenUgcModal,
      badge: 'Favorito 📸',
      iconBg: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    },
    {
      id: 'review',
      title: 'Califica tu experiencia de entrega',
      desc: 'Cuéntanos qué tal fue el servicio y la atención de entrega.',
      points: '+500 pts',
      icon: Star,
      action: onOpenReviewModal,
      badge: 'Rápido ⚡',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'referral',
      title: 'Recomienda Only Home a un amigo',
      desc: 'Tu amigo recibe $100.000 de descuento y tú ganas puntos.',
      points: '+2.500 pts',
      icon: Share2,
      action: onOpenReferralModal,
      badge: 'Recompensa 🎁',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Misiones para Ganar Puntos</span>
        </h3>
        <span className="text-[11px] text-muted-foreground font-medium">Actualizado hoy</span>
      </div>

      <div className="space-y-2.5">
        {missions.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.id}
              onClick={m.action}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-blue/40 transition-colors cursor-pointer shadow-xs relative"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${m.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-foreground truncate">{m.title}</h4>
                      <span className="px-1.5 py-0.2 rounded-md bg-secondary text-[9px] font-bold text-slate-600 border border-slate-200 shrink-0">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    {m.points}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
