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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header minimalista y limpio */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                Dirección de entrega
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Ubica el punto en el mapa o escribe tu dirección
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Buscador de direcciones profesional */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={autocompleteInputRef}
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Busca calle, carrera o lugar de referencia..."
                className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
              />
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={isLocatingGPS}
                className="absolute right-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs"
                title="Detectar por GPS actual"
              >
                {isLocatingGPS ? (
                  <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
                ) : (
                  <Crosshair className="w-3 h-3 text-brand-blue" />
                )}
                <span>Mi GPS</span>
              </button>
            </div>
            {isReverseGeocoding && (
              <p className="text-[10px] text-brand-blue flex items-center gap-1 pl-1 pt-0.5 font-normal">
                <Loader2 className="w-3 h-3 animate-spin" /> Obteniendo dirección...
              </p>
            )}
          </div>

          {/* Mapa Interactivo con Pin Central Arrastrable */}
          <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Banner sutil flotante sobre el mapa */}
            <div className="absolute top-2.5 left-3 right-3 pointer-events-none flex justify-center">
              <div className="px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-sm text-white text-[10px] font-normal flex items-center gap-1.5 shadow-sm">
                <Navigation className="w-2.5 h-2.5 text-brand-blue shrink-0" />
                <span>Mueve el pin rojo para ajustar el punto exacto</span>
              </div>
            </div>

            {/* Fallback si la clave de Google Maps no está cargada */}
            {!GOOGLE_MAPS_API_KEY && !mapLoaded && (
              <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-1.5">
                <MapPin className="w-6 h-6 text-brand-blue" />
                <p className="text-xs font-medium text-slate-700">
                  Ingresa tu dirección manualmente
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs font-normal">
                  Puedes escribir la dirección y complementos abajo para guardarla.
                </p>
              </div>
            )}
          </div>

          {/* Inputs de detalles complementarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Apto / Casa / Interior
              </label>
              <div className="relative flex items-center">
                <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={aptComplement}
                  onChange={(e) => setAptComplement(e.target.value)}
                  placeholder="Ej: Apto 502, Torre 3"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Edificio / Conjunto / Indicación
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  placeholder="Ej: Conjunto Mirador, portería"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer con botones concisos */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Confirmar Ubicación</span>
          </button>
        </div>
      </div>
    </div>
  )
}

