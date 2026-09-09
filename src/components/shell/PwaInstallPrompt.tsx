import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Sparkles, CheckCircle } from 'lucide-react'

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIosInstructions, setIsIosInstructions] = useState(false)

  useEffect(() => {
    // Si ya fue instalada o descartada, no mostrar
    if (localStorage.getItem('pwa_prompt_dismissed_v2')) {
      return
    }

    // Verificar si ya está en modo standalone (instalada)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    if (isStandalone) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Mostrar flotante con un retardo amigable de 2 segundos tras cargar
      setTimeout(() => setShowPrompt(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detección iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIos) {
      setTimeout(() => setShowPrompt(true), 2500)
    }

    // Fallback para otros navegadores donde no dispara beforeinstallprompt
    const fallbackTimer = setTimeout(() => {
      if (!localStorage.getItem('pwa_prompt_dismissed_v2') && !isStandalone) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
        localStorage.setItem('pwa_prompt_dismissed_v2', 'installed')
      }
      setDeferredPrompt(null)
    } else {
      setIsIosInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed_v2', 'true')
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="pointer-events-auto w-full p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-brand-blue/30 shadow-2xl space-y-3 relative overflow-hidden"
        >
          {/* Subtle gradient background highlight */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-foreground">Instalar App Only Home</h4>
                  <span className="px-1.5 py-0.2 rounded-md bg-brand-blue/10 text-brand-blue text-[9px] font-extrabold uppercase">
                    Rápido y liviano
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  Sigue tu pedido en vivo con GPS y recibe alertas directas en tu celular.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              aria-label="Cerrar aviso de instalación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* iOS Instructions tooltip if needed */}
          {isIosInstructions ? (
            <div className="p-3 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 text-xs text-brand-darkBlue dark:text-brand-lightBlue space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>📲 Para instalar en iPhone / iPad:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-foreground/80">
                1. Toca el botón <strong>Compartir</strong> (<span className="text-xs font-mono">⎋</span>) en la barra inferior de Safari.
                <br />
                2. Selecciona <strong>"Agregar a pantalla de inicio"</strong>.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs shadow-md shadow-brand-blue/25 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicación</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                Ahora no
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
