import React from 'react'
import { Rocket, Package, CheckCircle2, Truck, Home } from 'lucide-react'
import type { OrderStatus } from '../../types'

interface StatusStepperProps {
  status: OrderStatus
  className?: string
}

const STEPS = [
  { key: 'confirmed', label: 'Confirmado', shortLabel: 'Confirmado', icon: Rocket },
  { key: 'in_production', label: 'En Producción', shortLabel: 'En Producción', icon: Package },
  { key: 'ready_for_dispatch', label: 'Listo', shortLabel: 'Listo', icon: CheckCircle2 },
  { key: 'in_transit', label: 'En Ruta', shortLabel: 'En Ruta', icon: Truck },
  { key: 'delivered', label: 'Entregado', shortLabel: 'Entregado', icon: Home },
]

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'confirmed':
      return 0
    case 'in_production':
      return 1
    case 'ready_for_dispatch':
      return 2
    case 'in_transit':
      return 3
    case 'delivered':
      return 4
    case 'delayed':
      return 1
    default:
      return 0
  }
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ status, className = '' }) => {
  const currentIndex = getStepIndex(status)

  // Para 5 pasos, el centro del primer círculo está en 10% y el último en 90% (rango de 80%)
  const fillPercentage = (currentIndex / (STEPS.length - 1)) * 80

  return (
    <div className={`w-full py-2.5 ${className}`}>
      {/* Top indicator title */}
      <div className="flex justify-between items-center mb-3 px-0.5">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase whitespace-nowrap">
          Progreso de tu pedido
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
            <div key={step.key} className="relative z-10 flex flex-col items-center flex-1 min-w-0">
              {/* Outer circle wrapper for crisp center alignment */}
              <div className="h-8 flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-blue border-2 border-brand-blue text-white shadow-xs'
                      : isCurrent
                      ? 'bg-brand-blue border-2 border-brand-blue text-white ring-4 ring-brand-blue/20 scale-110 shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
              </div>
              
              <span
                className={`mt-1.5 text-[9.5px] text-center tracking-tight transition-colors duration-200 whitespace-nowrap leading-none ${
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

