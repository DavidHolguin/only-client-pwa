import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, Package, Award, User } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Tracking', icon: Truck },
  { path: '/pedidos', label: 'Pedidos', icon: Package },
  { path: '/club', label: 'Only Club', icon: Award, badge: 1 },
  { path: '/perfil', label: 'Perfil', icon: User },
]

export const FloatingBottomDock: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-around gap-1 px-3 py-2 rounded-full glass-card bg-card/90 dark:bg-[#12141C]/90 border border-white/10 dark:border-white/10 shadow-dock max-w-sm w-full backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-300 ${
                isActive
                  ? 'text-white font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 bg-brand-blue rounded-full shadow-glow-blue"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>

                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
