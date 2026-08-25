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

  // Para 5 pasos, el centro del primer círculo está en 10% y el último en 90% (rango de 80%)
  const fillPercentage = (currentIndex / (STEPS.length - 1)) * 80

  return (
    <div className={`w-full py-3 ${className}`}>
      {/* Top micro-badge indicator */}
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Progreso de tu pedido
        </span>
        <span className="text-[10px] font-extrabold text-brand-blue px-2.5 py-0.5 rounded-full bg-brand-blue/10 border border-brand-blue/20">
          Fase {currentIndex + 1} de 5: {currentStep?.label}
        </span>
      </div>

      <div className="relative flex items-center justify-between w-full">
        {/* Background Line Connector: Conecta del centro del 1er paso (10%) al último (90%) */}
        <div className="absolute left-[10%] right-[10%] top-[16px] h-[3px] bg-slate-200 z-0 rounded-full" />
        
        {/* Animated Fill Line */}
        <div
          className="absolute left-[10%] top-[16px] h-[3px] bg-brand-blue transition-all duration-500 z-0 rounded-full"
          style={{ width: `${fillPercentage}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center flex-1">
              {/* Outer circle wrapper for crisp center alignment */}
              <div className="h-8 flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-blue border-2 border-brand-blue text-white shadow-xs'
                      : isCurrent
                      ? 'bg-white border-2 border-brand-blue text-brand-blue ring-4 ring-brand-blue/15 scale-110 shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
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
                className={`mt-2 text-[10px] text-center tracking-tight transition-colors duration-200 leading-tight ${
                  isCurrent
                    ? 'text-brand-blue font-extrabold'
                    : isCompleted
                    ? 'text-slate-800 font-bold'
                    : 'text-slate-400 font-medium'
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
