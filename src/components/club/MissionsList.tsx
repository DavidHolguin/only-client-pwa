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
      desc: 'Muestra cómo luce tu sala o comedor Only Home y gana puntos al instante.',
      points: '+1.000 pts',
      icon: Camera,
      action: onOpenUgcModal,
      badge: 'Más Popular 📸',
      gradient: 'from-brand-blue/15 to-transparent border-brand-blue/30',
      btnColor: 'bg-brand-blue text-white',
    },
    {
      id: 'review',
      title: 'Califica tu experiencia de entrega',
      desc: 'Cuéntanos qué tal fue el servicio y la atención de nuestro equipo logístico.',
      points: '+500 pts',
      icon: Star,
      action: onOpenReviewModal,
      badge: 'Rápido ⚡',
      gradient: 'from-gold/15 to-transparent border-gold/30',
      btnColor: 'bg-gold text-slate-950 font-bold',
    },
    {
      id: 'referral',
      title: 'Recomienda Only Home a un amigo',
      desc: 'Tu amigo recibe $100.000 de descuento y tú ganas puntos en su primera compra.',
      points: '+2.500 pts',
      icon: Share2,
      action: onOpenReferralModal,
      badge: 'Viral 🎁',
      gradient: 'from-emerald-500/15 to-transparent border-emerald-500/30',
      btnColor: 'bg-emerald-600 text-white',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>Misiones para Ganar Puntos</span>
        </h3>
        <span className="text-[11px] text-muted-foreground">Actualizado hoy</span>
      </div>

      <div className="space-y-2.5">
        {missions.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.id}
              onClick={m.action}
              className={`p-3.5 rounded-2xl glass-card bg-card border ${m.gradient} hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-sm relative overflow-hidden`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0 border border-border mt-0.5">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground">{m.title}</h4>
                      <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[9px] font-bold text-muted-foreground border border-border">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-black font-mono text-gold bg-gold/10 px-2 py-0.5 rounded-lg border border-gold/30">
                    {m.points}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
