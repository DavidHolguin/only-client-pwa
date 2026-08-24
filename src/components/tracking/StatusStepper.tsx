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

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Continuous Background Line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-border/60 z-0" />
        
        {/* Active Progress Bar */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-brand-blue transition-all duration-500 z-0 shadow-glow-blue"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 90}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-blue text-white shadow-sm'
                    : isCurrent
                    ? 'bg-brand-blue text-white ring-4 ring-brand-blue/30 shadow-glow-blue animate-pulse-subtle'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] text-center whitespace-nowrap font-medium ${
                  isCurrent
                    ? 'text-brand-blue dark:text-brand-lightBlue font-bold'
                    : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground'
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
