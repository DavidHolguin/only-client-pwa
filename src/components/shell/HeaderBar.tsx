import React from 'react'
import { useTheme } from 'next-themes'
import { Bell, Moon, Sun, ShieldCheck } from 'lucide-react'
import { useCustomerAuth } from '../../context/AuthContext'

interface HeaderBarProps {
  onOpenNotifications?: () => void
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenNotifications }) => {
  const { customer } = useCustomerAuth()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const firstName = customer?.full_name?.split(' ')[0] || 'Cliente'

  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/30 text-brand-blue font-bold text-lg shadow-sm">
          <span className="font-extrabold text-sm tracking-tighter blue-gradient-text">OH</span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Hola, {firstName}
            </h1>
            {customer?.tier === 'oro' || customer?.tier === 'diamante' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {customer?.phone ? `+${customer.phone}` : 'Only Home VIP'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <button
          onClick={onOpenNotifications}
          aria-label="Notificaciones"
          className="relative w-8 h-8 rounded-full flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-blue rounded-full ring-2 ring-background" />
        </button>

        {customer?.avatar_url && (
          <img
            src={customer.avatar_url}
            alt={customer.full_name}
            className="w-8 h-8 rounded-full object-cover border border-brand-blue/40"
          />
        )}
      </div>
    </header>
  )
}
