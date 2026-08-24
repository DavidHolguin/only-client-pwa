import { supabase } from './supabase'

export interface TelemetryPayload {
  customer_id?: string
  phone?: string
  order_id?: string
  signal_type:
    | 'page_view'
    | 'dwell_time_high'
    | 'order_tracking_view'
    | 'map_opened'
    | 'invoice_download'
    | 'referral_shared'
    | 'ugc_uploaded'
    | 'address_change_started'
    | 'review_submitted'
    | 'delivery_confirmed'
  dwell_time_seconds?: number
  metadata?: Record<string, unknown>
}

export async function sendTelemetrySignal(payload: TelemetryPayload) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqeoxruodotrgpmipivj.supabase.co'
    const endpoint = `${supabaseUrl}/functions/v1/customer-telemetry-ingest`

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.debug('[telemetry] background send caught', err)
    })
  } catch (e) {
    console.debug('[telemetry] dispatch failed', e)
  }
}
