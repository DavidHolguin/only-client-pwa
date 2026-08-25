import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, MessageSquare, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerAuth } from '../context/AuthContext'

export const AuthPage: React.FC = () => {
  const { requestOtp, verifyOtp, loginAsDemo } = useCustomerAuth()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('3152532876')
  const [code, setCode] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 10) {
      toast.error('Por favor ingresa un número de WhatsApp válido (10 dígitos).')
      return
    }

    setLoading(true)
    const normalized = cleanDigits.length === 10 ? `57${cleanDigits}` : cleanDigits
    const res = await requestOtp(normalized)
    setLoading(false)

    if (res.ok) {
      setChallengeId(res.challenge_id || 'chal-demo')
      setStep('otp')
      toast.success('💬 ¡Código enviado a tu WhatsApp por Only Agent!')
    } else {
      toast.error(res.reason === 'rate_limited' ? 'Demasiados intentos. Espera unos minutos.' : 'Error al enviar el código.')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) {
      toast.error('El código debe tener 6 dígitos.')
      return
    }

    setLoading(true)
    const normalized = phone.replace(/\D/g, '')
    const fullPhone = normalized.length === 10 ? `57${normalized}` : normalized
    const res = await verifyOtp(fullPhone, code, challengeId)
    setLoading(false)

    if (res.ok) {
      toast.success('✨ ¡Bienvenido a Only Home!')
    } else {
      toast.error('Código incorrecto o expirado. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-20%] w-72 h-72 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="pt-8 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl overflow-hidden border border-slate-200 shadow-md">
          <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
            ONLY HOME
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Portal de Clientes & Seguimiento de Pedidos
          </p>
        </div>
      </div>

      {/* Form Container */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="my-auto p-6 rounded-3xl glass-card bg-card border border-border/80 shadow-2xl space-y-5"
      >
        {step === 'phone' ? (
          <>
            <div className="space-y-1 text-center">
              <h2 className="text-base font-bold text-foreground">Ingresa con tu WhatsApp</h2>
              <p className="text-xs text-muted-foreground">
                Te enviaremos un código de seguridad de 6 dígitos para acceder a tus pedidos.
              </p>
            </div>

            <form onSubmit={handleSendPhone} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Número de Celular (Colombia)
                </label>
                <div className="flex items-center rounded-2xl bg-background border border-input px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand-blue transition-all">
                  <span className="text-xs font-mono font-bold text-muted-foreground pr-2 border-r border-border">
                    🇨🇴 +57
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="315 253 2876"
                    className="w-full pl-3 bg-transparent text-sm font-mono font-bold text-foreground focus:outline-none tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-blue hover:bg-brand-lightBlue text-white font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Código por WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-foreground">Digita el Código de Seguridad</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Enviado a +57 {phone}
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block text-center mb-2">
                  Código de 6 Dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center py-3 rounded-2xl bg-background border border-input text-2xl font-mono font-extrabold tracking-[0.5em] text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-blue hover:bg-brand-lightBlue text-white font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>Verificar & Entrar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                ← Cambiar número de teléfono
              </button>
            </form>
          </>
        )}

        {/* Demo Fast Access */}
        <div className="pt-3 border-t border-border/50 text-center">
          <button
            type="button"
            onClick={loginAsDemo}
            className="text-[11px] text-brand-blue dark:text-brand-lightBlue font-bold hover:underline"
          >
            Acceso Rápido de Demostración (1-Tap Demo) →
          </button>
        </div>
      </motion.div>

      {/* Footer Security Guarantee */}
      <div className="pb-4 flex items-center justify-center gap-2 text-muted-foreground text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Autenticación cifrada vía Only Agent WhatsApp</span>
      </div>
    </div>
  )
}
