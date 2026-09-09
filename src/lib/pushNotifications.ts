import { supabase } from './supabase'

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY ||
  'BAqukApjdOY8dj_n2gPL6riBZ9aacfT_cWssHytkw7GsZFfIIu7aoOrl08eJmTq0Y32WLh0B_C_aEJ3jfTEB7wU'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

function computeDeviceId(): string {
  const ua = navigator.userAgent ?? 'ua_unknown'
  const lang = navigator.language ?? 'es'
  const s = ua + '|' + lang + '|' + (typeof window !== 'undefined' ? window.location.origin : '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return 'dev_' + h.toString(16)
}

export interface PushStatus {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
}

export function getPushStatus(): PushStatus {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { isSupported: false, permission: 'unsupported', isSubscribed: false }
  }
  const isSub = localStorage.getItem('only_push_subscribed') === 'true'
  return {
    isSupported: true,
    permission: Notification.permission,
    isSubscribed: isSub && Notification.permission === 'granted',
  }
}

/**
 * Solicita permiso de notificaciones y suscribe el navegador a Web Push / FCM
 */
export async function requestPushPermissionAndSubscribe(customerPhone?: string): Promise<{
  ok: boolean
  reason?: string
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, reason: 'Tu navegador no soporta notificaciones Web Push' }
  }
  if (!('serviceWorker' in navigator)) {
    return { ok: false, reason: 'Service Worker no soportado en este dispositivo' }
  }

  try {
    // 1. Pedir permiso nativo
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { ok: false, reason: 'Permiso de notificaciones rechazado por el usuario' }
    }

    // 2. Registrar o recuperar el service worker de notificaciones
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    }
    await navigator.serviceWorker.ready

    // 3. Suscribir a PushManager con la VAPID key
    const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    })

    const subscriptionJson = subscription.toJSON()
    const endpoint = subscriptionJson.endpoint || ''
    const keys = subscriptionJson.keys || {}
    const p256dh = keys.p256dh || ''
    const auth = keys.auth || ''
    const deviceId = computeDeviceId()

    // 4. Guardar en Supabase para envíos dirigidos
    try {
      // Guardar en fcm_subscriptions
      await supabase.from('fcm_subscriptions').upsert(
        {
          fcm_token: endpoint,
          device_id: deviceId,
          device_name: navigator.userAgent.slice(0, 100),
          user_agent: navigator.userAgent,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'fcm_token' }
      )
    } catch (e) {
      console.warn('[Push] Error saving to fcm_subscriptions:', e)
    }

    try {
      // Guardar en user_push_subscriptions
      await supabase.from('user_push_subscriptions').upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          is_active: true,
        },
        { onConflict: 'endpoint' }
      )
    } catch (e) {
      console.warn('[Push] Error saving to user_push_subscriptions:', e)
    }

    localStorage.setItem('only_push_subscribed', 'true')
    localStorage.setItem('only_push_endpoint', endpoint)

    // Notificación de bienvenida local confirmando la activación
    if (registration.showNotification) {
      registration.showNotification('¡Notificaciones Activadas! 🔔', {
        body: 'Te avisaremos en tiempo real cuando tu camión inicie ruta y esté cerca a tu puerta.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
      })
    }

    return { ok: true }
  } catch (error: any) {
    console.error('Error al suscribir notificaciones push:', error)
    return { ok: false, reason: error?.message || 'Error desconocido al suscribir' }
  }
}
