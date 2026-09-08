import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Clave configurable desde .env (VITE_GOOGLE_MAPS_API_KEY)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

let isConfigured = false

export function configureGoogleMaps() {
  if (!isConfigured) {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      language: 'es',
      region: 'CO',
    })
    isConfigured = true
  }
}

export async function loadGoogleMapsLibraries() {
  configureGoogleMaps()
  const [{ Map }, { Marker }, { Geocoder }] = await Promise.all([
    importLibrary('maps') as Promise<google.maps.MapsLibrary>,
    importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
    importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>,
  ])
  await importLibrary('places')
  return { Map, Marker, Geocoder }
}

export interface LatLngCoords {
  lat: number
  lng: number
}

export interface ConfirmedLocationData {
  address: string
  lat: number
  lng: number
  complement?: string
  reference?: string
  city?: string
  timestamp: string
}

const LOCAL_STORAGE_KEY_PREFIX = 'only_confirmed_location_'

export function saveConfirmedLocationLocal(orderNumber: string, data: ConfirmedLocationData) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${orderNumber}`, JSON.stringify(data))
  } catch (e) {
    console.warn('Could not save confirmed location locally', e)
  }
}

export function getConfirmedLocationLocal(orderNumber: string): ConfirmedLocationData | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${orderNumber}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

