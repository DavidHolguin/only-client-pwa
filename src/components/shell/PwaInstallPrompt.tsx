import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if previously dismissed
    if (sessionStorage.getItem('pwa_prompt_dismissed')) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // iOS detection (Safari standalone check)
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    if (isIos && !isStandalone) {
      setShowPrompt(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else {
      alert('Para instalar en iPhone/iPad: toca el botón "Compartir" en Safari y selecciona "Agregar a pantalla de inicio" 📲')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
    sessionStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  if (!showPrompt || isDismissed) return null

  return (
    <div className="mx-4 my-2 p-3.5 rounded-2xl bg-gradient-to-r from-brand-blue/15 via-brand-darkBlue/10 to-transparent border border-brand-blue/30 backdrop-blur-md flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-brand-blue text-white flex items-center justify-center shadow-glow-blue shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Instalar App Only Home</h4>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Acceso instantáneo a tu pedido y alertas de entrega en vivo.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-lightBlue text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
