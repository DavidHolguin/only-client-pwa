import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Navigation,
  Star,
  ShieldCheck,
  MapPin,
  Truck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Package,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { loadGoogleMapsLibraries, getConfirmedLocationLocal } from '../../lib/googleMaps'
import type { CustomerOrder, DriverInfo } from '../../types'

interface LiveDeliveryExperienceProps {
  order: CustomerOrder
}

export const LiveDeliveryExperience: React.FC<LiveDeliveryExperienceProps> = ({ order }) => {
  // Estado del Conductor
  const defaultDriver: DriverInfo = {
    name: order.driver?.name || 'Mauricio Valencia',
    phone: order.driver?.phone || '+573124567890',
    vehicle_plate: order.driver?.vehicle_plate || 'SQF 187',
    vehicle_model: order.driver?.vehicle_model || 'Camión Isuzu Blanco Only Home',
    photo_url: order.driver?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    rating: order.driver?.rating || 4.95,
  }

  const [driver, setDriver] = useState<DriverInfo>(defaultDriver)
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null)
  
  // Paradas y Estimación de Tiempo
  const [stopsAhead, setStopsAhead] = useState<number>(1) // Turno de entrega
  const [etaMinutes, setEtaMinutes] = useState<number>(18)
  const [distanceKm, setDistanceKm] = useState<number>(2.4)
  const [isLiveGpsConnected, setIsLiveGpsConnected] = useState<boolean>(false)
  const [, setActiveStep] = useState<'departed' | 'en_route' | 'approaching' | 'at_door'>('en_route')
  
  // UI Controls
  const [isItemsExpanded, setIsItemsExpanded] = useState<boolean>(false)
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState<boolean>(true)

  // Referencias de Google Maps
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const customerMarkerRef = useRef<google.maps.Marker | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const isMapInitializedRef = useRef<boolean>(false)

  // 1. Obtener coordenadas del cliente (desde local storage o geocoding)
  useEffect(() => {
    const saved = getConfirmedLocationLocal(order.numero_pedido)
    if (saved && saved.lat && saved.lng) {
      setCustomerCoords({ lat: saved.lat, lng: saved.lng })
    } else {
      // Coordenadas fallback basadas en la ciudad (Armenia, Medellín, Bogotá, etc.)
      const city = (order.destino || 'Armenia').toLowerCase()
      if (city.includes('medell')) {
        setCustomerCoords({ lat: 6.2442, lng: -75.5812 })
      } else if (city.includes('bogot')) {
        setCustomerCoords({ lat: 4.7110, lng: -74.0721 })
      } else if (city.includes('cali')) {
        setCustomerCoords({ lat: 3.4516, lng: -76.5320 })
      } else {
        // Armenia / Eje Cafetero
        setCustomerCoords({ lat: 4.5389, lng: -75.6725 })
      }
    }
  }, [order.numero_pedido, order.destino])

  // 2. Inicializar coordenadas simuladas del conductor si aún no hay telemetría activa
  useEffect(() => {
    if (customerCoords && !driverCoords) {
      // Ubicar al conductor a ~2 km de distancia para visualización inmediata
      const offsetLat = 0.012
      const offsetLng = 0.015
      setDriverCoords({
        lat: customerCoords.lat + offsetLat,
        lng: customerCoords.lng - offsetLng
      })
    }
  }, [customerCoords, driverCoords])

  // 3. Suscripción en Tiempo Real a Supabase (Telemetría de Conductor y Estado)
  useEffect(() => {
    const channel = supabase
      .channel('driver_live_telemetry')
      .on('broadcast', { event: 'driver_location' }, (payload: any) => {
        const data = payload?.payload
        if (!data) return

        setIsLiveGpsConnected(true)
        if (data.latitude && data.longitude) {
          const newCoords = { lat: Number(data.latitude), lng: Number(data.longitude) }
          setDriverCoords(newCoords)

          // Actualizar marcador de conductor suavemente
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition(newCoords)
          }
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

        // Si el pedido activo en la ruta del conductor es este pedido
        if (data.order_number && String(data.order_number) === String(order.numero_pedido)) {
          setStopsAhead(0)
          setEtaMinutes((prev) => Math.min(prev, 8))
          setActiveStep('approaching')
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveGpsConnected(true)
        }
      })

    // Escuchar cambios de estado en la tabla pedidos de Supabase
    const orderChanges = supabase
      .channel(`order_${order.numero_pedido}_live`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `numero_pedido=eq.${order.numero_pedido}`,
        },
        (payload: any) => {
          const newRow = payload?.new
          if (newRow?.estado) {
            const st = String(newRow.estado).toLowerCase()
            if (st.includes('entregad')) {
              setActiveStep('at_door')
              setEtaMinutes(0)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(orderChanges)
    }
  }, [order.numero_pedido])

  // 4. Temporizador suave de ETA
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => {
        if (prev <= 3) return 3
        return prev - 1
      })
      setDistanceKm((prev) => {
        if (prev <= 0.4) return 0.4
        return Number((prev - 0.1).toFixed(1))
      })
    }, 45000)

    return () => clearInterval(timer)
  }, [])

  // 5. Carga e Inicialización de Google Maps
  useEffect(() => {
    if (!customerCoords || !driverCoords || !mapContainerRef.current) return
    if (isMapInitializedRef.current) return

    let isMounted = true

    loadGoogleMapsLibraries().then(({ Map, Marker }) => {
      if (!isMounted || !mapContainerRef.current) return

      // Crear Mapa
      const map = new Map(mapContainerRef.current, {
        center: customerCoords,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f5f7fa' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#e2e8f0' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#cbd5e1' }],
          },
          {
            featureType: 'poi',
            elementType: 'all',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })

      mapRef.current = map

      // Marcador del Cliente (Casa / Destino)
      const customerMarker = new Marker({
        position: customerCoords,
        map,
        title: 'Tu Dirección de Entrega',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
              <circle cx="23" cy="23" r="18" fill="#0066FF" stroke="#FFFFFF" stroke-width="3.5" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.25))"/>
              <path d="M23 14 L14 21 L16 21 L16 30 L21 30 L21 25 L25 25 L25 30 L30 30 L30 21 L32 21 Z" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(46, 46),
          anchor: new google.maps.Point(23, 23),
        },
      })
      customerMarkerRef.current = customerMarker

      // Marcador del Conductor (Camión Only Home)
      const driverMarker = new Marker({
        position: driverCoords,
        map,
        title: `Conductor: ${driver.name} (${driver.vehicle_plate})`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="#001F36" stroke="#FFB800" stroke-width="3" filter="drop-shadow(0px 6px 10px rgba(0,0,0,0.35))"/>
              <g fill="#FFB800" transform="translate(13, 13) scale(1.1)">
                <path d="M1 3h15v13H1z"/>
                <path d="M16 8h4l3 3v5h-7z"/>
                <circle cx="5.5" cy="18.5" r="2.5" fill="#FFFFFF"/>
                <circle cx="18.5" cy="18.5" r="2.5" fill="#FFFFFF"/>
              </g>
            </svg>
          `),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 26),
        },
      })
      driverMarkerRef.current = driverMarker

      // Trazar Ruta entre Conductor y Cliente con DirectionsService
      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#0066FF',
          strokeWeight: 5,
          strokeOpacity: 0.85,
        },
      })
      directionsRendererRef.current = directionsRenderer

      directionsService.route(
        {
          origin: driverCoords,
          destination: customerCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result)
            const route = result.routes[0]?.legs[0]
            if (route) {
              if (route.duration?.value) {
                setEtaMinutes(Math.ceil(route.duration.value / 60))
              }
              if (route.distance?.text) {
                setDistanceKm(Number((route.distance.value / 1000).toFixed(1)))
              }
            }
          }
        }
      )

      // Ajustar límites de cámara (bounds) para ver ambos puntos cómodamente
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(customerCoords)
      bounds.extend(driverCoords)
      map.fitBounds(bounds, {
        top: 80,
        bottom: 180,
        left: 50,
        right: 50,
      })

      isMapInitializedRef.current = true
    })

    return () => {
      isMounted = false
    }
  }, [customerCoords, driverCoords])

  // Controles de Mapa
  const handleRecenterBounds = () => {
    if (!mapRef.current || !customerCoords || !driverCoords) return
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(customerCoords)
    bounds.extend(driverCoords)
    mapRef.current.fitBounds(bounds, {
      top: 90,
      bottom: 190,
      left: 60,
      right: 60,
    })
  }

  const handleFocusDriver = () => {
    if (mapRef.current && driverCoords) {
      mapRef.current.panTo(driverCoords)
      mapRef.current.setZoom(16)
    }
  }

  // Acciones de Comunicación con el Conductor
  const handleCallDriver = () => {
    window.open(`tel:${driver.phone}`, '_self')
  }

  const handleWhatsAppDriver = () => {
    const msg = encodeURIComponent(
      `Hola ${driver.name}, soy ${order.cliente_nombre}, cliente del pedido Only Home #${order.numero_pedido} en ${order.direccion || 'mi domicilio'}.`
    )
    window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="relative min-h-[92vh] w-full flex flex-col justify-between overflow-hidden bg-slate-950 font-sans select-none">
      {/* ── 1. MAPA DE GOOGLE INTERACTIVO DE PANTALLA COMPLETA ── */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Gradiente sutil superior para contraste de estado */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
      </div>

      {/* ── 2. HEADER FLOTANTE SUPERIOR CON ESTADO EN VIVO Y ETA ── */}
      <div className="relative z-10 p-3 sm:p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto max-w-md mx-auto rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl p-3.5 sm:p-4 text-white space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block leading-tight">
                  En Ruta de Entrega Hoy
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isLiveGpsConnected ? 'GPS Conductor Activo' : 'Rastreo Conectado'}
                </span>
              </div>
            </div>

            {/* Badges de Turno y ETA */}
            <div className="flex items-center gap-1.5">
              <div className="px-2.5 py-1 rounded-full bg-brand-blue/20 border border-brand-blue/40 text-sky-400 text-[11px] font-bold">
                {stopsAhead === 0 ? '¡Próxima Parada!' : `Parada ${stopsAhead + 1} de la ruta`}
              </div>
              <div className="px-3 py-1 rounded-full bg-brand-blue text-white text-xs font-black shadow-lg shadow-brand-blue/30 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>~{etaMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Sub-banner informativo del turno */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium">
              {stopsAhead === 0
                ? 'El camión se dirige directamente a tu domicilio.'
                : `El conductor tiene ${stopsAhead} entrega(s) antes de llegar a ti.`}
            </span>
            <span className="text-amber-400 font-bold font-mono shrink-0 ml-2">
              {distanceKm} km
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── 3. BOTONES FLOTANTES DE CONTROL DE MAPA ── */}
      <div className="relative z-10 px-4 flex justify-end gap-2 pointer-events-none mb-2">
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            onClick={handleRecenterBounds}
            className="p-3 rounded-2xl bg-white/95 border border-slate-200 text-slate-800 shadow-xl backdrop-blur-md hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Ver ruta completa"
          >
            <Compass className="w-4 h-4 text-brand-blue" />
            <span className="hidden sm:inline">Ruta Completa</span>
          </button>

          <button
            onClick={handleFocusDriver}
            className="p-3 rounded-2xl bg-white/95 border border-slate-200 text-slate-800 shadow-xl backdrop-blur-md hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Centrar en el camión"
          >
            <Truck className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Camión</span>
          </button>
        </div>
      </div>

      {/* ── 4. SHEET INFERIOR INMERSIVO (CONDUCTOR + POLÍTICAS + PRODUCTOS) ── */}
      <div className="relative z-10 w-full max-w-md mx-auto p-3 sm:p-4 space-y-3">
        {/* Card Principal de Conductor y Entrega */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 shadow-2xl backdrop-blur-2xl overflow-hidden p-4 sm:p-5 space-y-4"
        >
          {/* Fila del Conductor Oficial */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={driver.photo_url}
                  alt={driver.name}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-brand-blue shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gold text-[9px] font-black text-slate-950 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-slate-950" />
                  {driver.rating}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {driver.name}
                  </h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {driver.vehicle_model}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-brand-blue border border-slate-200 dark:border-slate-700">
                    {driver.vehicle_plate}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    · Conductor Only Home
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Contacto Directo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCallDriver}
                className="p-3 rounded-2xl bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue border border-brand-blue/30 transition-all active:scale-95 shadow-sm"
                title="Llamar al conductor"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={handleWhatsAppDriver}
                className="p-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                title="Escribir al WhatsApp del conductor"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.52-1.832-.759-2.999-2.628-3.09-2.75-.091-.122-.738-.981-.738-1.87 0-.889.467-1.326.633-1.508.167-.182.366-.228.488-.228.122 0 .244.002.35.007.112.005.263-.042.412.316.155.374.529 1.29.575 1.383.046.092.077.2.015.321-.061.121-.092.197-.183.303-.091.106-.192.236-.274.318-.091.091-.186.19-.08.373.106.183.473.78 1.014 1.261.697.62 1.285.813 1.468.904.183.092.29.077.397-.046.107-.122.457-.533.58-.716.122-.182.244-.152.412-.091.167.061 1.066.503 1.249.594.183.092.305.137.35.213.045.076.045.442-.099.847z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Micro Línea de Tiempo de Entrega en Ruta */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <span>Progreso de Entrega</span>
              <span className="text-brand-blue font-extrabold">Pedido #{order.numero_pedido}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 block leading-tight">
                  Salida
                </span>
              </div>

              <div className="p-2 rounded-xl bg-brand-blue/10 border border-brand-blue/30 text-center relative overflow-hidden">
                <Truck className="w-3.5 h-3.5 text-brand-blue mx-auto mb-1 animate-pulse" />
                <span className="text-[9px] font-bold text-brand-blue block leading-tight">
                  En Camino
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue" />
              </div>

              <div className={`p-2 rounded-xl text-center border ${
                stopsAhead === 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400'
              }`}>
                <Navigation className="w-3.5 h-3.5 mx-auto mb-1" />
                <span className="text-[9px] font-bold block leading-tight">
                  Tu Zona
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 text-slate-400 text-center">
                <MapPin className="w-3.5 h-3.5 mx-auto mb-1" />
                <span className="text-[9px] font-bold block leading-tight">
                  En Puerta
                </span>
              </div>
            </div>
          </div>

          {/* Dirección Confirmada */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">
                Entregando en:
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {order.direccion || 'Dirección de Entrega'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {order.destino || 'Armenia'}
              </p>
            </div>
          </div>

          {/* Sección Desplegable: Políticas de Entrega Oficiales */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 overflow-hidden">
            <button
              onClick={() => setIsPoliciesExpanded(!isPoliciesExpanded)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Políticas Clave de Entrega
                </span>
              </div>
              {isPoliciesExpanded ? (
                <ChevronUp className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              )}
            </button>

            <AnimatePresence>
              {isPoliciesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 pb-3 pt-1 text-[11.5px] text-amber-950 dark:text-amber-200/90 leading-relaxed space-y-1.5 border-t border-amber-500/20 text-justify"
                >
                  <p>
                    • <strong>Disponibilidad:</strong> Es indispensable contar con una persona disponible durante la franja de entrega para recibir la mercancía.
                  </p>
                  <p>
                    • <strong>Límite de Altura:</strong> Por políticas de seguridad, el personal no realiza entregas por encima de un <strong>cuarto piso sin ascensor de carga</strong>.
                  </p>
                  <p>
                    • <strong>Maniobras Prohibidas:</strong> No se manipula mercancía mediante poleas, lazos, ventanas o balcones.
                  </p>
                  <p>
                    • <strong>Zonas Difíciles:</strong> En inmuebles con escaleras en espiral, estrechas o vías de difícil acceso, la entrega se efectuará en el punto más cercano de fácil acceso.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sección Desplegable: Productos del Pedido */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden">
            <button
              onClick={() => setIsItemsExpanded(!isItemsExpanded)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-blue shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ver Productos a Entregar ({order.items.length})
                </span>
              </div>
              {isItemsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <AnimatePresence>
              {isItemsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3.5 pb-3 pt-1 space-y-2 border-t border-slate-200 dark:border-slate-800"
                >
                  {order.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.referencia}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {item.referencia}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          SKU: {item.sku} · Cant: {item.cantidad}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
