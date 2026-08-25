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
      <nav className="pointer-events-auto flex items-center justify-between gap-1 p-1.5 rounded-2xl bg-white/95 border border-slate-200 shadow-xl shadow-slate-900/10 max-w-md w-full backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 bg-brand-blue rounded-xl shadow-md shadow-brand-blue/25"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              {/* Icon & Label container */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                  {item.badge && !isActive && (
                    <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

