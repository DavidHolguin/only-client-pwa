import React from 'react'
import { Sparkles, Gift, Check, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { RewardItem } from '../../types'
import { REWARDS_CATALOG } from '../../lib/mockData'
import { triggerRewardConfetti } from '../../lib/confetti'
import { useCustomerAuth } from '../../context/AuthContext'
import { useTelemetry } from '../../context/TelemetryContext'

interface RewardsCatalogProps {
  userPoints: number
}

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({ userPoints }) => {
  const { customer, updateProfile } = useCustomerAuth()
  const { trackEvent } = useTelemetry()

  const handleRedeem = (reward: RewardItem) => {
    if (userPoints < reward.points_cost) {
      toast.error(`Te faltan ${(reward.points_cost - userPoints).toLocaleString()} puntos para canjear este premio.`)
      return
    }

    if (customer) {
      updateProfile({ total_points: customer.total_points - reward.points_cost })
    }

    triggerRewardConfetti()
    trackEvent('reward_redeemed' as any, { reward_id: reward.id, title: reward.title })
    toast.success(`🎉 ¡Canje exitoso! Hemos generado tu código de beneficio: ${reward.discount_value}.`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-brand-blue" />
          <span>Catálogo de Beneficios Only</span>
        </h3>
        <span className="text-[11px] text-muted-foreground font-mono">Disponibles: {REWARDS_CATALOG.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {REWARDS_CATALOG.map((item) => {
          const canAfford = userPoints >= item.points_cost

          return (
            <div
              key={item.id}
              className="p-3 rounded-2xl glass-card bg-card border border-border/80 flex flex-col justify-between space-y-2 hover:border-brand-blue/50 transition-all shadow-sm"
            >
              <div>
                <div className="relative rounded-xl overflow-hidden aspect-video mb-2 bg-secondary/40">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-extrabold text-gold font-mono border border-gold/40">
                    {item.points_cost.toLocaleString()} pts
                  </span>
                </div>

                <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                  {item.description}
                </p>
              </div>

              <button
                onClick={() => handleRedeem(item)}
                disabled={!canAfford}
                className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  canAfford
                    ? 'bg-brand-blue hover:bg-brand-lightBlue text-white shadow-glow-blue active:scale-95'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-70'
                }`}
              >
                {canAfford ? (
                  <>
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span>Canjear</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Bloqueado</span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
