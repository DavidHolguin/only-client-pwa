import React from 'react'
import { Bell, ShieldCheck } from 'lucide-react'
import { useCustomerAuth } from '../../context/AuthContext'

interface HeaderBarProps {
  onOpenNotifications?: () => void
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenNotifications }) => {
  const { customer } = useCustomerAuth()
  const firstName = customer?.full_name?.split(' ')[0] || 'Cliente'

  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3 bg-white/90 backdrop-blur-md border-b border-border/60 flex items-center justify-between shadow-xs">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
          <img src="/logoIconoOH.jpg" alt="Only Home" className="w-full h-full object-cover" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Hola, {firstName}
            </h1>
            {customer?.tier === 'oro' || customer?.tier === 'diamante' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {customer?.phone ? `+${customer.phone}` : 'Only Home'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNotifications}
          aria-label="Notificaciones"
          className="relative w-8 h-8 rounded-full flex items-center justify-center bg-secondary/80 border border-border text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full ring-2 ring-white" />
        </button>

        {customer?.avatar_url ? (
          <img
            src={customer.avatar_url}
            alt={customer.full_name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}

