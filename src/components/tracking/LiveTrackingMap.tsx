import React, { useState, useEffect } from 'react'
import { Phone, MessageSquare, Navigation, Star, ShieldCheck, MapPin } from 'lucide-react'
import type { DriverInfo } from '../../types'

interface LiveTrackingMapProps {
  driver?: DriverInfo
  destinationAddress?: string
  etaMinutes?: number
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  driver = {
    name: 'Mauricio Valencia',
    phone: '+573004829102',
    vehicle_plate: 'WXY-892',
    vehicle_model: 'Camión Isuzu Blanco Only Home',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: 4.95,
  },
  destinationAddress = 'Carrera 43A #1-50, Apto 902, Medellín',
  etaMinutes = 24,
}) => {
  const [eta, setEta] = useState(etaMinutes)

  // Subtle ETA countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => (prev > 5 ? prev - 1 : prev))
    }, 45000)
    return () => clearInterval(timer)
  }, [])

  const handleCallDriver = () => {
    window.open(`tel:${driver.phone}`, '_self')
  }

  const handleWhatsAppDriver = () => {
    const msg = encodeURIComponent(`Hola ${driver.name}, soy el cliente de la entrega de Only Home en ${destinationAddress}.`)
    window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="w-full rounded-3xl overflow-hidden glass-card border border-brand-blue/30 shadow-lg relative bg-[#090A0F]/80">
      {/* Map Header Banner */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-brand-blue/20 via-brand-darkBlue/30 to-brand-blue/10 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            En Ruta de Entrega (En Vivo)
          </span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-brand-blue text-white text-[11px] font-bold shadow-glow-blue">
          Llega en ~{eta} min
        </div>
      </div>

      {/* Styled Interactive Simulated Visual Map (Dark Mode Vector Route) */}
      <div className="relative w-full h-52 bg-[#12141C] overflow-hidden flex items-center justify-center">
        {/* Subtle Map Grid Lines & Roads */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* SVG Route Line */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 50 140 Q 120 60 190 100 T 320 60"
            fill="none"
            stroke="#0066FF"
            strokeWidth="4"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          <path
            d="M 50 140 Q 120 60 190 100 T 260 75"
            fill="none"
            stroke="#FFB800"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Courier Pin on Route */}
        <div className="absolute top-[60px] left-[245px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gold text-slate-950 flex items-center justify-center font-bold shadow-glow-gold animate-bounce">
            🚚
          </div>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-gold font-mono font-semibold border border-gold/40">
            {driver.vehicle_plate}
          </span>
        </div>

        {/* Destination Home Pin */}
        <div className="absolute top-[42px] right-[28px] flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-glow-blue">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-mono border border-white/20">
            Tu Casa
          </span>
        </div>

        {/* Origin Warehouse Pin */}
        <div className="absolute bottom-[20px] left-[35px] flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-slate-700 border-2 border-white/60" />
          <span className="text-[10px] text-muted-foreground font-mono">Centro Logístico Only</span>
        </div>

        {/* Live GPS badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-card/90 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[10px] text-muted-foreground">
          <Navigation className="w-3 h-3 text-brand-blue" />
          <span>GPS Activo</span>
        </div>
      </div>

      {/* Driver Card & Actions */}
      <div className="p-4 bg-card/95 border-t border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={driver.photo_url}
                alt={driver.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-blue/50"
              />
              <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-gold text-[9px] font-bold text-slate-950">
                <Star className="w-2.5 h-2.5 fill-slate-950" />
                {driver.rating}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-foreground">{driver.name}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
              <p className="text-[11px] font-mono text-brand-blue font-semibold">{driver.vehicle_plate}</p>
            </div>
          </div>
        </div>

        {/* Direct Contact Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCallDriver}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs border border-border transition-all active:scale-95"
          >
            <Phone className="w-4 h-4 text-brand-blue" />
            <span>Llamar al Conductor</span>
          </button>
          <button
            onClick={handleWhatsAppDriver}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Conductor</span>
          </button>
        </div>
      </div>
    </div>
  )
}
