import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  MapPin,
  Check,
  Search,
  Crosshair,
  Building2,
  Home,
  FileText,
  Loader2,
  Navigation,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  loadGoogleMapsLibraries,
  GOOGLE_MAPS_API_KEY,
  saveConfirmedLocationLocal,
  getConfirmedLocationLocal,
} from '../../lib/googleMaps'
import { updateOrderDeliveryAddress } from '../../api/orders'

interface LocationConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  currentAddress: string
  city?: string
  onConfirmedSuccess?: (newAddress: string, coords?: { lat: number; lng: number }) => void
}

export const LocationConfirmModal: React.FC<LocationConfirmModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  currentAddress,
  city = 'Colombia',
  onConfirmedSuccess,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const autocompleteInputRef = useRef<HTMLInputElement>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [markerInstance, setMarkerInstance] = useState<google.maps.Marker | null>(null)
  const [geocoderInstance, setGeocoderInstance] = useState<google.maps.Geocoder | null>(null)

  // Coordenadas seleccionadas (Default Colombia / Medellín / Bogotá)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 6.2442,
    lng: -75.5812,
  })

  // Inputs del formulario
  const [streetAddress, setStreetAddress] = useState(currentAddress)
  const [aptComplement, setAptComplement] = useState('')
  const [referenceNotes, setReferenceNotes] = useState('')
  const [isLocatingGPS, setIsLocatingGPS] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  // Cargar datos previos si ya existían
  useEffect(() => {
    if (isOpen && orderNumber) {
      const saved = getConfirmedLocationLocal(orderNumber)
      if (saved) {
        setCoords({ lat: saved.lat, lng: saved.lng })
        setStreetAddress(saved.address)
        setAptComplement(saved.complement || '')
        setReferenceNotes(saved.reference || '')
      } else {
        setStreetAddress(currentAddress)
      }
    }
  }, [isOpen, orderNumber, currentAddress])

  // Inicializar Google Maps API
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    loadGoogleMapsLibraries()
      .then(({ Map, Marker, Geocoder }) => {
        if (!isMounted || !mapContainerRef.current) return

        const geocoder = new Geocoder()
        setGeocoderInstance(geocoder)

        // Crear mapa estilizado
        const initialCenter = coords
        const map = new Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        })

        // Marker draggable estilo pin de entrega
        const marker = new Marker({
          position: initialCenter,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Punto exacto de entrega Only Home',
        })

        // Evento arrastre de marcador (Estilo Rappi: al soltar se actualiza dirección)
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          const newLat = e.latLng.lat()
          const newLng = e.latLng.lng()
          setCoords({ lat: newLat, lng: newLng })

          // Reverse geocode
          setIsReverseGeocoding(true)
          geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            setIsReverseGeocoding(false)
            if (status === 'OK' && results && results[0]) {
              setStreetAddress(results[0].formatted_address)
            }
          })
        })

        // Places Autocomplete en el input de búsqueda
        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            componentRestrictions: { country: 'co' },
            fields: ['formatted_address', 'geometry', 'name'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry || !place.geometry.location) {
              return
            }

            const newLat = place.geometry.location.lat()
            const newLng = place.geometry.location.lng()
            const formatted = place.formatted_address || place.name || ''

            setCoords({ lat: newLat, lng: newLng })
            setStreetAddress(formatted)

            map.setCenter({ lat: newLat, lng: newLng })
            map.setZoom(17)
            marker.setPosition({ lat: newLat, lng: newLng })
          })
        }

        // Si hay una dirección inicial y no había coordenadas previas, geocodificar dirección inicial
        if (currentAddress && !getConfirmedLocationLocal(orderNumber)) {
          geocoder.geocode(
            { address: `${currentAddress}, ${city}, Colombia` },
            (results, status) => {
              if (status === 'OK' && results && results[0]?.geometry?.location) {
                const loc = results[0].geometry.location
                const lat = loc.lat()
                const lng = loc.lng()
                setCoords({ lat, lng })
                map.setCenter({ lat, lng })
                marker.setPosition({ lat, lng })
                setStreetAddress(results[0].formatted_address)
              }
            }
          )
        }

        setMapInstance(map)
        setMarkerInstance(marker)
        setMapLoaded(true)
      })
      .catch((err) => {
        console.warn('Google Maps API load error:', err)
        setMapLoaded(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  if (!isOpen) return null

  // Acción: Usar GPS del dispositivo
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no soporta geolocalización GPS')
      return
    }

    setIsLocatingGPS(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false)
        const newLat = pos.coords.latitude
        const newLng = pos.coords.longitude
        setCoords({ lat: newLat, lng: newLng })

        if (mapInstance && markerInstance) {
          mapInstance.setCenter({ lat: newLat, lng: newLng })
          mapInstance.setZoom(17)
          markerInstance.setPosition({ lat: newLat, lng: newLng })
        }

        // Reverse Geocoding
        if (geocoderInstance) {
          setIsReverseGeocoding(true)
          geocoderInstance.geocode(
            { location: { lat: newLat, lng: newLng } },
            (results, status) => {
              setIsReverseGeocoding(false)
              if (status === 'OK' && results && results[0]) {
                setStreetAddress(results[0].formatted_address)
                toast.success('Ubicación GPS detectada con precisión')
              }
            }
          )
        }
      },
      (_err) => {
        setIsLocatingGPS(false)
        toast.error('No pudimos acceder a tu ubicación GPS. Por favor busca tu dirección.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Guardar y Confirmar Ubicación
  const handleConfirmLocation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!streetAddress.trim()) {
      toast.error('Ingresa una dirección o selecciona el punto en el mapa')
      return
    }

    setIsSubmitting(true)

    // Formatear dirección completa profesional
    let fullFormattedAddress = streetAddress.trim()
    if (aptComplement.trim()) {
      fullFormattedAddress += ` - ${aptComplement.trim()}`
    }
    if (referenceNotes.trim()) {
      fullFormattedAddress += ` (${referenceNotes.trim()})`
    }

    const locationData = {
      address: streetAddress.trim(),
      lat: coords.lat,
      lng: coords.lng,
      complement: aptComplement.trim() || undefined,
      reference: referenceNotes.trim() || undefined,
      city,
      timestamp: new Date().toISOString(),
    }

    // 1. Guardar localmente
    saveConfirmedLocationLocal(orderNumber, locationData)

    // 2. Guardar en Supabase
    await updateOrderDeliveryAddress(orderNumber, fullFormattedAddress, {
      lat: coords.lat,
      lng: coords.lng,
      complement: aptComplement.trim(),
      reference: referenceNotes.trim(),
    })

    setIsSubmitting(false)
    toast.success('¡Ubicación de entrega confirmada con éxito!')

    if (onConfirmedSuccess) {
      onConfirmedSuccess(fullFormattedAddress, coords)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header con gradiente elegante */}
        <div className="px-5 py-4 bg-gradient-to-r from-brand-blue/15 via-brand-darkBlue/20 to-brand-blue/10 border-b border-border/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-glow-blue">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                  Confirmar Ubicación de Entrega
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/20">
                  GPS LIVE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Afina el punto exacto donde nuestro conductor entregará tu pedido.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Barra de búsqueda de Google Maps Places */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Buscar dirección o lugar</span>
              {isReverseGeocoding && (
                <span className="text-[10px] text-brand-blue animate-pulse flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Obteniendo dirección...
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
              <input
                ref={autocompleteInputRef}
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Ej: Calle 10 # 43E-20, Poblado, Medellín"
                className="w-full pl-9 pr-24 py-2.5 rounded-2xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={isLocatingGPS}
                className="absolute right-1.5 px-2.5 py-1.5 rounded-xl bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-[10px] font-bold flex items-center gap-1 transition-all"
                title="Detectar por GPS actual"
              >
                {isLocatingGPS ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Crosshair className="w-3 h-3" />
                )}
                <span>Mi GPS</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Container (Estilo Rappi con Pin Central / Arrastrable) */}
          <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-border bg-secondary/30 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Overlay Banner de Instrucción */}
            <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none flex justify-center">
              <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-medium border border-white/10 flex items-center gap-1.5 shadow-md">
                <Navigation className="w-3 h-3 text-brand-blue shrink-0" />
                <span>Arrastra el pin rojo al punto exacto de la entrada</span>
              </div>
            </div>

            {/* Fallback si la clave de Google Maps no está cargada aún */}
            {!GOOGLE_MAPS_API_KEY && !mapLoaded && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                <MapPin className="w-8 h-8 text-brand-blue animate-bounce" />
                <p className="text-xs font-bold text-foreground">
                  Modo de confirmación rápida activo
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Puedes ingresar tu dirección y detalles abajo para que el conductor reciba la ruta.
                </p>
              </div>
            )}
          </div>

          {/* Formulario Complementario de Entrega (Apto / Casa / Referencia) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Apto / Casa / Interior
              </label>
              <div className="relative flex items-center">
                <Home className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={aptComplement}
                  onChange={(e) => setAptComplement(e.target.value)}
                  placeholder="Ej: Apto 502, Torre 3"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Edificio / Conjunto / Notas
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  placeholder="Ej: Conjunto Mirador, dejar en portería"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Info pill de sincronización con conductores */}
          <div className="p-3 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-blue shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Esta ubicación se sincroniza de forma inmediata con la app de conductores <strong>Only Drivers</strong> para guiar al camión mediante Google Maps y Waze.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-card border-t border-border flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            Confirmar más tarde
          </button>
          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl bg-brand-blue hover:bg-brand-lightBlue text-white text-xs font-black shadow-glow-blue flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>Confirmar Ubicación Exacta</span>
          </button>
        </div>
      </div>
    </div>
  )
}

