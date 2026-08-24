import React from 'react'
import { Check, Clock, PackageCheck, Truck, Home } from 'lucide-react'
import type { OrderStatus } from '../../types'

interface StatusStepperProps {
  status: OrderStatus
  className?: string
}

const STEPS = [
  { key: 'pending_confirmation', label: 'Confirmado', icon: Clock },
  { key: 'in_production', label: 'En Producción', icon: PackageCheck },
  { key: 'ready_for_dispatch', label: 'Listo', icon: PackageCheck },
  { key: 'in_transit', label: 'En Ruta', icon: Truck },
  { key: 'delivered', label: 'Entregado', icon: Home },
]

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending_confirmation':
      return 0
    case 'in_production':
      return 1
    case 'ready_for_dispatch':
      return 2
    case 'scheduled_for_dispatch':
    case 'in_transit':
      return 3
    case 'delivered':
      return 4
    default:
      return 1
  }
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ status, className = '' }) => {
  const currentIndex = getStepIndex(status)
  const currentStep = STEPS[currentIndex]

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Top micro-badge indicator */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Progreso del pedido
        </span>
        <span className="text-[10px] font-extrabold text-brand-blue dark:text-brand-lightBlue px-2 py-0.5 rounded-full bg-brand-blue/10 border border-brand-blue/20">
          Fase {currentIndex + 1} de 5: {currentStep?.label.toUpperCase()}
        </span>
      </div>

      <div className="relative flex items-center justify-between px-2">
        {/* Background Line Connector */}
        <div className="absolute left-6 right-6 top-[15px] h-[3px] bg-slate-200 dark:bg-slate-800 z-0 rounded-full" />
        
        {/* Animated Fill Line */}
        <div
          className="absolute left-6 top-[15px] h-[3px] bg-gradient-to-r from-brand-blue to-blue-500 transition-all duration-700 z-0 rounded-full shadow-[0_0_8px_rgba(0,102,255,0.5)]"
          style={{ width: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 24px)` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center flex-1">
              {/* Outer circle wrapper for crisp alignment */}
              <div className="h-8 flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                    isCompleted
                      ? 'bg-brand-blue border-brand-blue text-white shadow-md'
                      : isCurrent
                      ? 'bg-card border-brand-blue text-brand-blue shadow-[0_0_12px_rgba(0,102,255,0.4)] scale-110'
                      : 'bg-card border-slate-200 dark:border-slate-800 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              
              <span
                className={`mt-2.5 text-[10px] text-center font-bold tracking-tight transition-colors duration-300 ${
                  isCurrent
                    ? 'text-brand-blue dark:text-brand-lightBlue font-extrabold'
                    : isCompleted
                    ? 'text-foreground/80'
                    : 'text-muted-foreground/70'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
