import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  MapPin,
  Check,
  Search,
  Crosshair,
  Building2,
  Home,
  Loader2,
  Navigation,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  Minus,
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

  // Modo expandido (Pantalla completa / mapa inmersivo en móvil)
  const [isExpanded, setIsExpanded] = useState(false)

  // Estado de movimiento del mapa para animación de pin estilo Rappi
  const [isMapMoving, setIsMapMoving] = useState(false)

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

  // Reverse geocoding debounce ref
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Función para geocodificación inversa segura
  const executeReverseGeocode = useCallback(
    (lat: number, lng: number, geocoder: google.maps.Geocoder) => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current)
      }

      reverseGeocodeTimeoutRef.current = setTimeout(() => {
        setIsReverseGeocoding(true)
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsReverseGeocoding(false)
          if (status === 'OK' && results && results[0]) {
            const formatted = results[0].formatted_address
            setStreetAddress(formatted)
            if (autocompleteInputRef.current) {
              autocompleteInputRef.current.value = formatted
            }
          }
        })
      }, 350)
    },
    []
  )

  // Inicializar Google Maps API
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    loadGoogleMapsLibraries()
      .then(({ Map, Marker, Geocoder }) => {
        if (!isMounted || !mapContainerRef.current) return

        const geocoder = new Geocoder()
        setGeocoderInstance(geocoder)

        const initialCenter = coords
        const map = new Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'greedy',
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
          title: 'Punto de entrega Only Home',
        })

        // Sincronizar arrastre manual del marker
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          const newLat = e.latLng.lat()
          const newLng = e.latLng.lng()
          setCoords({ lat: newLat, lng: newLng })
          map.panTo({ lat: newLat, lng: newLng })
          executeReverseGeocode(newLat, newLng, geocoder)
        })

        // Detección de movimiento del mapa para animar pin estilo Rappi
        map.addListener('dragstart', () => {
          setIsMapMoving(true)
        })

        map.addListener('drag', () => {
          setIsMapMoving(true)
        })

        map.addListener('idle', () => {
          setIsMapMoving(false)
          const center = map.getCenter()
          if (center) {
            const newLat = center.lat()
            const newLng = center.lng()
            setCoords({ lat: newLat, lng: newLng })
            marker.setPosition({ lat: newLat, lng: newLng })
            executeReverseGeocode(newLat, newLng, geocoder)
          }
        })

        // Vincular Autocomplete en el input principal
        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            componentRestrictions: { country: 'co' },
            fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place || !place.geometry || !place.geometry.location) {
              return
            }

            const newLat = place.geometry.location.lat()
            const newLng = place.geometry.location.lng()
            const formatted = place.formatted_address || place.name || ''

            setCoords({ lat: newLat, lng: newLng })
            setStreetAddress(formatted)

            map.panTo({ lat: newLat, lng: newLng })
            map.setZoom(17)
            marker.setPosition({ lat: newLat, lng: newLng })

            // Cerrar teclado/dropdown en móviles
            autocompleteInputRef.current?.blur()
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
                map.panTo({ lat, lng })
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

  // Ajustar mapa al alternar modo expandido
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        google.maps.event.trigger(mapInstance, 'resize')
        mapInstance.panTo(coords)
      }, 200)
    }
  }, [isExpanded, coords, mapInstance])

  if (!isOpen) return null

  // Acción: Limpiar buscador
  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setStreetAddress('')
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = ''
      autocompleteInputRef.current.focus()
    }
  }

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
          mapInstance.panTo({ lat: newLat, lng: newLng })
          mapInstance.setZoom(17)
          markerInstance.setPosition({ lat: newLat, lng: newLng })
        }

        if (geocoderInstance) {
          executeReverseGeocode(newLat, newLng, geocoderInstance)
          toast.success('Ubicación GPS detectada con éxito')
        }
      },
      (_err) => {
        setIsLocatingGPS(false)
        toast.error('No pudimos acceder a tu GPS. Por favor escribe tu dirección.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Acción: Recentrar en el pin actual
  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.panTo(coords)
      mapInstance.setZoom(17)
      toast.info('Mapa recentrado en tu ubicación')
    }
  }

  // Acción: Zoom Controls
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 16) + 1)
    }
  }

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom((mapInstance.getZoom() || 16) - 1)
    }
  }

  // Guardar y Confirmar Ubicación
  const handleConfirmLocation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!streetAddress.trim()) {
      toast.error('Por favor escribe tu dirección o selecciona el punto en el mapa')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white border border-slate-200/80 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isExpanded
            ? 'h-full sm:h-[95vh] sm:max-w-4xl sm:rounded-3xl rounded-none'
            : 'max-w-lg rounded-3xl max-h-[92vh] m-3 sm:m-0'
        }`}
      >
        {/* Header minimalista y limpio */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                Confirmar dirección de entrega
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {isExpanded
                  ? 'Modo mapa interactivo en pantalla completa'
                  : 'Busca tu dirección o mueve el mapa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón de Expandir / Minimizar Mapa */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
              title={isExpanded ? 'Contraer vista' : 'Expandir mapa a pantalla completa'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Contraer</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-brand-blue" />
                  <span className="text-[11px]">Expandir</span>
                </>
              )}
            </button>

            {/* Cerrar modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className={`flex-1 flex flex-col overflow-y-auto ${
            isExpanded ? 'p-0' : 'p-4 sm:p-5 space-y-3.5'
          }`}
        >
          {/* Barra de Búsqueda Principal (Siempre accesible) */}
          <div className={`${isExpanded ? 'p-3 bg-slate-50/90 border-b border-slate-200 z-10' : 'space-y-1'}`}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />

              <input
                ref={autocompleteInputRef}
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault()
                }}
                placeholder="Escribe calle, carrera, avenida o lugar..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 sm:bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all font-medium"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {/* Botón de limpiar búsqueda (X) */}
                {streetAddress.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Botón GPS Rápido */}
                <button
                  type="button"
                  onClick={handleUseCurrentGPS}
                  disabled={isLocatingGPS}
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                  title="Detectar por GPS actual"
                >
                  {isLocatingGPS ? (
                    <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
                  ) : (
                    <Crosshair className="w-3 h-3 text-brand-blue" />
                  )}
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            {isReverseGeocoding && (
              <p className="text-[10px] text-brand-blue flex items-center gap-1 pl-1 pt-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Obteniendo dirección exacta...
              </p>
            )}
          </div>

          {/* Contenedor del Mapa Interactivo */}
          <div
            className={`relative w-full overflow-hidden bg-slate-100 ${
              isExpanded
                ? 'flex-1 min-h-[300px]'
                : 'h-60 sm:h-64 rounded-2xl border border-slate-200'
            }`}
          >
            {/* Mapa de Google */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Banner flotante interactivo superior */}
            <div className="absolute top-3 left-3 right-3 pointer-events-none flex justify-center z-10">
              <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md">
                <Navigation className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{isMapMoving ? 'Moviendo mapa...' : 'Mueve el mapa para fijar el punto exacto'}</span>
              </div>
            </div>

            {/* Botones de Control Flotantes en el Mapa */}
            <div className="absolute right-3 bottom-4 flex flex-col gap-2 z-10">
              {/* Botón Recentrar en Pin */}
              <button
                type="button"
                onClick={handleRecenter}
                className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 flex items-center justify-center hover:bg-white active:scale-95 transition-all"
                title="Recentrar en el pin"
              >
                <RotateCcw className="w-4 h-4 text-slate-700" />
              </button>

              {/* Botón GPS Flotante */}
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                disabled={isLocatingGPS}
                className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 flex items-center justify-center hover:bg-white active:scale-95 transition-all"
                title="Ir a mi ubicación GPS actual"
              >
                {isLocatingGPS ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
                ) : (
                  <Crosshair className="w-4 h-4 text-brand-blue" />
                )}
              </button>

              {/* Botones Zoom */}
              <div className="flex flex-col rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md overflow-hidden">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-9 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors border-b border-slate-100"
                  title="Acercar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-9 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Alejar"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fallback si Google Maps no está disponible */}
            {!GOOGLE_MAPS_API_KEY && !mapLoaded && (
              <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-1.5 z-10">
                <MapPin className="w-6 h-6 text-brand-blue" />
                <p className="text-xs font-semibold text-slate-700">
                  Ingresa tu dirección manualmente
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs font-normal">
                  Puedes escribir la dirección y datos de entrega en los campos inferiores.
                </p>
              </div>
            )}
          </div>

          {/* Formulario de Detalles (Apto / Indicaciones) */}
          <div className={`${isExpanded ? 'p-4 bg-white border-t border-slate-200' : 'space-y-3'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Apto / Casa / Interior (Opcional)
                </label>
                <div className="relative flex items-center">
                  <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={aptComplement}
                    onChange={(e) => setAptComplement(e.target.value)}
                    placeholder="Ej: Apto 402, Torre B"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Edificio / Portería / Indicación
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={referenceNotes}
                    onChange={(e) => setReferenceNotes(e.target.value)}
                    placeholder="Ej: Frente al parque, portería"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dirección Detectada Badge */}
            {streetAddress && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="font-semibold text-slate-700">Punto fijado: </span>
                  <span className="text-slate-600 font-normal">{streetAddress}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer con botones concisos y táctiles */}
        <div className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors active:scale-95"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmLocation}
            disabled={isSubmitting || !streetAddress.trim()}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/95 text-white text-xs font-bold shadow-md shadow-brand-blue/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Confirmar Ubicación</span>
          </button>
        </div>
      </div>
    </div>
  )
}

