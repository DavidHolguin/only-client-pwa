import React from 'react'
import { Share2, Copy, Check, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useTelemetry } from '../../context/TelemetryContext'

interface ReferralShareCardProps {
  referralCode: string
}

export const ReferralShareCard: React.FC<ReferralShareCardProps> = ({ referralCode }) => {
  const { trackEvent } = useTelemetry()
  const referralLink = `https://portal.onlyhome.com.co/ref/${referralCode.toLowerCase()}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('¡Enlace de referido copiado al portapapeles! 📋')
    trackEvent('referral_shared', { method: 'copy_link', code: referralCode })
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `¡Hola! Te comparto mi enlace exclusivo de Only Home para que recibas $100.000 COP de descuento en tu primer pedido de muebles para tu hogar: ${referralLink} 🛋️✨`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    trackEvent('referral_shared', { method: 'whatsapp', code: referralCode })
  }

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-blue/15 via-brand-darkBlue/25 to-brand-blue/10 border border-brand-blue/30 relative overflow-hidden space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-glow-blue">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Invita a tus Amigos</h4>
            <p className="text-[11px] text-muted-foreground">
              Ganas <strong className="text-gold font-bold">+2.500 Pts</strong> cuando tu referido compre.
            </p>
          </div>
        </div>
      </div>

      {/* Code Box */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-background/80 border border-border">
        <div className="font-mono text-xs font-bold tracking-wider text-brand-blue dark:text-brand-lightBlue px-2">
          {referralCode}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar Link</span>
        </button>
      </div>

      {/* WhatsApp Share CTA */}
      <button
        onClick={handleWhatsAppShare}
        className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
      >
        <Share2 className="w-4 h-4" />
        <span>Compartir por WhatsApp</span>
      </button>
    </div>
  )
}
