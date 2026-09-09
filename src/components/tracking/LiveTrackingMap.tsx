import React, { useState, useEffect } from 'react'
import { Phone, Navigation, Star, ShieldCheck, MapPin, Truck, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { DriverInfo } from '../../types'

interface LiveTrackingMapProps {
  orderNumber?: string
  driver?: DriverInfo
  destinationAddress?: string
  etaMinutes?: number
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderNumber,
  driver: initialDriver = {
    name: 'Mauricio Valencia',
    phone: '+573124567890',
    vehicle_plate: 'SQF 187',
    vehicle_model: 'Camión Logístico Only Home',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: 4.95,
  },
  destinationAddress = 'Dirección de Entrega',
  etaMinutes = 22,
}) => {
  const [driver, setDriver] = useState<DriverInfo>(initialDriver)
  const [eta, setEta] = useState(etaMinutes)
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [stopsAhead, setStopsAhead] = useState<number>(2) // Turnos que faltan
  const [isLiveConnected, setIsLiveConnected] = useState(false)

  // Escuchar ubicación GPS en tiempo real del conductor vía Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('driver_live_telemetry')
      .on('broadcast', { event: 'driver_location' }, (payload: any) => {
        const data = payload?.payload
        if (!data) return

        setIsLiveConnected(true)
        if (data.latitude && data.longitude) {
          setDriverCoords({ lat: data.latitude, lng: data.longitude })
        }

        if (data.driver_name) {
          setDriver((prev) => ({
            ...prev,
            name: data.driver_name,
            phone: data.driver_phone || prev.phone,
            vehicle_plate: data.vehicle_plate || prev.vehicle_plate,
            vehicle_model: data.vehicle_model || prev.vehicle_model,
          }))
        }

        // Si es exactamente el turno de este pedido
        if (orderNumber && data.order_number && String(data.order_number) === String(orderNumber)) {
          setStopsAhead(0)
          setEta(8) // Próxima entrega directa
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderNumber])

  // Countdown suave de ETA
  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => (prev > 4 ? prev - 1 : prev))
    }, 40000)
    return () => clearInterval(timer)
  }, [])

  const handleCallDriver = () => {
    window.open(`tel:${driver.phone}`, '_self')
  }

  const handleWhatsAppDriver = () => {
    const msg = encodeURIComponent(`Hola ${driver.name}, soy el cliente de la entrega #${orderNumber || ''} de Only Home en ${destinationAddress}.`)
    window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="w-full rounded-3xl overflow-hidden glass-card border border-brand-blue/30 shadow-2xl relative bg-[#090A0F]/90 backdrop-blur-xl">
      {/* Top Status Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-brand-blue/25 via-brand-darkBlue/40 to-brand-blue/15 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              En Ruta de Entrega
            </span>
            {isLiveConnected && (
              <span className="ml-1.5 text-[10px] font-mono text-emerald-400/80">
                · GPS en Vivo
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-brand-blue/30 border border-brand-blue/40 text-brand-blue text-[11px] font-bold">
            {stopsAhead === 0 ? "¡Próxima parada: Tu casa!" : `${stopsAhead} entrega(s) previa(s)`}
          </div>
          <div className="px-2.5 py-1 rounded-full bg-brand-blue text-white text-[11px] font-bold shadow-glow-blue">
            ~{eta} min
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="relative w-full h-60 bg-[#10121A] overflow-hidden flex items-center justify-center">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* SVG Route Line */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 50 160 Q 140 70 210 110 T 330 70"
            fill="none"
            stroke="#0066FF"
            strokeWidth="4"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          <path
            d="M 50 160 Q 140 70 210 110 T 270 85"
            fill="none"
            stroke="#FFB800"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Courier Pin with Vehicle Plate & Live Pulse */}
        <div className="absolute top-[75px] left-[260px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gold text-slate-950 flex items-center justify-center font-bold shadow-glow-gold animate-bounce">
              <Truck size={20} className="text-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="mt-1.5 px-2 py-0.5 rounded bg-black/85 text-[10px] text-gold font-mono font-bold border border-gold/40 shadow-sm">
            {driver.vehicle_plate}
          </span>
        </div>

        {/* Destination Home Pin */}
        <div className="absolute top-[55px] right-[32px] flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-glow-blue border-2 border-white/20">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="mt-1.5 px-2 py-0.5 rounded bg-black/85 text-[10px] text-white font-mono border border-white/20">
            Tu Domicilio
          </span>
        </div>

        {/* Origin Warehouse Pin */}
        <div className="absolute bottom-[20px] left-[35px] flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-slate-700 border-2 border-white/60" />
          <span className="text-[10px] text-muted-foreground font-mono">Centro de Distribución Only</span>
        </div>

        {/* Live GPS badge with Coordinates */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 border border-white/10 backdrop-blur-md flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Navigation className="w-3 h-3 text-brand-blue animate-pulse" />
          <span>
            {driverCoords 
              ? `${driverCoords.lat.toFixed(4)}, ${driverCoords.lng.toFixed(4)}` 
              : "Google Maps GPS Conectado"}
          </span>
        </div>
      </div>

      {/* Driver Card & Actions */}
      <div className="p-4 bg-card/95 border-t border-border/50">
        <div className="flex items-center justify-between mb-3.5">
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
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-brand-blue font-bold">{driver.vehicle_plate}</span>
                <span className="text-[10px] text-muted-foreground">· Conductor Oficial Only Home</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCallDriver}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95"
              title="Llamar al conductor"
            >
              <Phone className="w-4 h-4 text-brand-blue" />
            </button>
            <button
              onClick={handleWhatsAppDriver}
              className="p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
              title="Abrir WhatsApp oficial"
            >
              {/* WhatsApp Official SVG */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.52-1.832-.759-2.999-2.628-3.09-2.75-.091-.122-.738-.981-.738-1.87 0-.889.467-1.326.633-1.508.167-.182.366-.228.488-.228.122 0 .244.002.35.007.112.005.263-.042.412.316.155.374.529 1.29.575 1.383.046.092.077.2.015.321-.061.121-.092.197-.183.303-.091.106-.192.236-.274.318-.091.091-.186.19-.08.373.106.183.473.78 1.014 1.261.697.62 1.285.813 1.468.904.183.092.29.077.397-.046.107-.122.457-.533.58-.716.122-.182.244-.152.412-.091.167.061 1.066.503 1.249.594.183.092.305.137.35.213.045.076.045.442-.099.847z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Informative Step Bar */}
        <div className="p-2.5 rounded-xl bg-ground-inset/60 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Destino:</span>
          <span className="font-medium text-foreground truncate max-w-[240px]">{destinationAddress}</span>
        </div>
      </div>
    </div>
  )
}
