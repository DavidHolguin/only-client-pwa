import React from 'react'
import { motion } from 'framer-motion'
import { Award, Sparkles, Gift, ShieldCheck, ChevronRight } from 'lucide-react'
import type { CustomerProfile } from '../../types'

interface PointsBalanceCardProps {
  customer: CustomerProfile
  onOpenRewards?: () => void
}

export const PointsBalanceCard: React.FC<PointsBalanceCardProps> = ({
  customer,
  onOpenRewards,
}) => {
  const points = customer.total_points
  const copValue = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(points * 100)

  // Tier calculation: bronce < 1000, plata < 3000, oro < 6000, diamante >= 6000
  let nextTier = 'Plata'
  let nextThreshold = 3000
  let currentBase = 1000
  let tierLabel = 'Nivel Plata'
  let tierColor = 'text-slate-300'
  let badgeBg = 'bg-slate-500/20 text-slate-200 border-slate-400/30'

  if (customer.tier === 'oro') {
    nextTier = 'Diamante'
    nextThreshold = 6000
    currentBase = 3000
    tierLabel = 'Nivel Oro VIP'
    tierColor = 'gold-gradient-text'
    badgeBg = 'bg-gold/20 text-gold border-gold/40'
  } else if (customer.tier === 'diamante') {
    nextTier = 'Máximo Nivel'
    nextThreshold = 6000
    currentBase = 6000
    tierLabel = 'Nivel Diamante'
    tierColor = 'blue-gradient-text'
    badgeBg = 'bg-brand-blue/20 text-brand-cyan border-brand-cyan/40'
  } else if (customer.tier === 'bronce') {
    nextTier = 'Plata'
    nextThreshold = 1000
    currentBase = 0
    tierLabel = 'Nivel Bronce'
    tierColor = 'text-amber-600'
    badgeBg = 'bg-amber-600/20 text-amber-500 border-amber-500/30'
  }

  const progressPercent = Math.min(
    100,
    Math.max(10, Math.round(((points - currentBase) / (nextThreshold - currentBase)) * 100))
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-3xl p-5 bg-gradient-to-br from-[#12141C] via-[#1A1D28] to-[#0D0E15] border border-gold/30 shadow-glow-gold relative overflow-hidden text-white"
    >
      {/* Background Glow Sphere */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Pill */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center border border-gold/30">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
              Programa de Lealtad
            </span>
            <h3 className="text-xs font-bold text-white tracking-wide">ONLY CLUB</h3>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeBg}`}>
          {tierLabel}
        </span>
      </div>

      {/* Main Points Display */}
      <div className="my-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-gold font-mono">
            {points.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-white/80">Puntos Only</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Equivalente a <strong className="text-white font-mono">{copValue}</strong> en bonos de descuento.
        </p>
      </div>

      {/* Tier Progress Bar */}
      <div className="space-y-1.5 my-4">
        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>Progreso a Nivel {nextTier}</span>
          <span className="font-mono text-white">{points} / {nextThreshold} pts</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-gold via-amber-400 to-yellow-200 rounded-full shadow-glow-gold"
          />
        </div>
      </div>

      {/* Quick Perks Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Gift className="w-3.5 h-3.5 text-gold" />
          <span>Regalo sorpresa en tu cumpleaños 🎂</span>
        </div>

        <button
          onClick={onOpenRewards}
          className="flex items-center gap-1 text-xs text-gold font-bold hover:underline"
        >
          <span>Canjear</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
