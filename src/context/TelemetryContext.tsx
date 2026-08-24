import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { sendTelemetrySignal, type TelemetryPayload } from '../lib/telemetry'
import { useCustomerAuth } from './AuthContext'

interface TelemetryContextType {
  trackEvent: (signalType: TelemetryPayload['signal_type'], metadata?: Record<string, unknown>, orderId?: string) => void
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { customer } = useCustomerAuth()
  const pageEnterTime = useRef<number>(Date.now())

  // Track page views and dwell time on route change
  useEffect(() => {
    const prevTime = pageEnterTime.current
    const now = Date.now()
    const dwellSeconds = Math.round((now - prevTime) / 1000)

    if (dwellSeconds > 5 && customer) {
      sendTelemetrySignal({
        customer_id: customer.id,
        phone: customer.phone,
        signal_type: dwellSeconds > 60 ? 'dwell_time_high' : 'page_view',
        dwell_time_seconds: dwellSeconds,
        metadata: { path: location.pathname },
      })
    }

    pageEnterTime.current = Date.now()

    // Page view trigger
    if (customer) {
      sendTelemetrySignal({
        customer_id: customer.id,
        phone: customer.phone,
        signal_type: 'page_view',
        metadata: { path: location.pathname },
      })
    }
  }, [location.pathname, customer])

  const trackEvent = (
    signalType: TelemetryPayload['signal_type'],
    metadata?: Record<string, unknown>,
    orderId?: string
  ) => {
    if (!customer) return
    sendTelemetrySignal({
      customer_id: customer.id,
      phone: customer.phone,
      order_id: orderId,
      signal_type: signalType,
      metadata: metadata || {},
    })
  }

  return (
    <TelemetryContext.Provider value={{ trackEvent }}>
      {children}
    </TelemetryContext.Provider>
  )
}

export const useTelemetry = () => {
  const context = useContext(TelemetryContext)
  if (!context) throw new Error('useTelemetry must be used within a TelemetryProvider')
  return context
}
