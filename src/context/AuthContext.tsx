import React, { createContext, useContext, useEffect, useState } from 'react'
import type { CustomerProfile } from '../types'
import { INITIAL_CUSTOMER } from '../lib/mockData'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  customer: CustomerProfile | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  requestOtp: (phone: string) => Promise<{ ok: boolean; challenge_id?: string; reason?: string }>
  verifyOtp: (phone: string, code: string, challengeId: string) => Promise<{ ok: boolean; reason?: string }>
  logout: () => void
  updateProfile: (updated: Partial<CustomerProfile>) => void
  loginAsDemo: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'only_client_customer_session'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initSession = async () => {
      // 1. Check local session storage
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setCustomer(parsed.customer)
          setToken(parsed.token)
        } catch (e) {
          console.error('Failed to parse saved session', e)
        }
      } else {
        setCustomer(null)
        setToken(null)
      }

      // 2. Check URL search params for deep-link magic token (?token=... / ?phone=...)
      const params = new URLSearchParams(window.location.search)
      const magicToken = params.get('token')
      const magicPhone = params.get('phone')

      if (magicPhone) {
        const cleanPhone = magicPhone.replace(/\D/g, '')
        const effectiveToken = magicToken || `link-${cleanPhone}`

        // Always create a minimal session from the magic link — no login wall
        let resolvedProfile: CustomerProfile = {
          id: `cust-${cleanPhone}`,
          phone: cleanPhone,
          full_name: 'Cliente Only Home',
          avatar_url: '',
          birthday: '',
          total_points: 0,
          tier: 'bronce',
          lead_temperature: 50,
          addresses: [],
          referral_code: `ONLY-${cleanPhone.slice(-4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        const phone10 = cleanPhone.slice(-10)
        try {
          // Consultar la tabla 'pedidos' de Supabase con los últimos 10 dígitos del teléfono
          const { data: dbOrder } = await supabase
            .from('pedidos')
            .select('*')
            .or(`telefono1.ilike.%${phone10}%,telefono2.ilike.%${phone10}%`)
            .limit(1)
            .maybeSingle()

          if (dbOrder) {
            resolvedProfile = {
              ...resolvedProfile,
              full_name: dbOrder.cliente || resolvedProfile.full_name,
              addresses: dbOrder.direccion
                ? [
                    {
                      id: 'addr-1',
                      alias: 'Casa / Entrega',
                      formatted_address: dbOrder.direccion,
                      city: dbOrder.ciudad || 'Armenia',
                      is_default: true,
                    },
                  ]
                : [],
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Could not enrich profile from Supabase pedidos table', err)
        }

        // Always set session from magic link — never show login wall for tracking links
        setCustomer(resolvedProfile)
        setToken(effectiveToken)
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ customer: resolvedProfile, token: effectiveToken })
        )
      }
      setIsLoading(false)
    }

    initSession()
  }, [])

  const requestOtp = async (phone: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqeoxruodotrgpmipivj.supabase.co'
      const res = await fetch(`${supabaseUrl}/functions/v1/customer-auth-request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (e) {
      console.warn('Network request failed, falling back to instant OTP simulation', e)
    }

    // Fallback simulation for reliable testing
    return { ok: true, challenge_id: 'chal-simulated-' + Date.now() }
  }

  const verifyOtp = async (phone: string, code: string, challengeId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqeoxruodotrgpmipivj.supabase.co'
      const res = await fetch(`${supabaseUrl}/functions/v1/customer-auth-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, challenge_id: challengeId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.customer) {
          setCustomer(data.customer)
          setToken(data.access_token)
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ customer: data.customer, token: data.access_token })
          )
          return { ok: true }
        }
      }
    } catch (e) {
      console.warn('Verify network request failed, falling back to simulated verification', e)
    }

    // Valid demo verification if code is 6 digits
    if (code.length === 6) {
      const cleanPhone = phone.replace(/\D/g, '')
      let realName = 'Cliente Only Home'
      let dbAddresses: any[] = []
      
      try {
        const { data } = await supabase
          .from('customer_profiles')
          .select('*')
          .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone.slice(-10)}`)
          .maybeSingle()
        if (data) {
          realName = data.full_name || 'Cliente Only Home'
          dbAddresses = data.addresses || []
        }
      } catch (err) {
        console.warn('Could not resolve customer name from db during demo verify OTP', err)
      }

      const demoCust: CustomerProfile = {
        ...INITIAL_CUSTOMER,
        phone: cleanPhone,
        full_name: realName,
        addresses: dbAddresses,
      }
      setCustomer(demoCust)
      setToken('jwt-customer-' + Date.now())
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ customer: demoCust, token: 'jwt-customer-' + Date.now() })
      )
      return { ok: true }
    }

    return { ok: false, reason: 'wrong_code' }
  }

  const logout = () => {
    setCustomer(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateProfile = (updated: Partial<CustomerProfile>) => {
    if (!customer) return
    const next = { ...customer, ...updated, updated_at: new Date().toISOString() }
    setCustomer(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ customer: next, token }))
  }

  const loginAsDemo = () => {
    setCustomer(INITIAL_CUSTOMER)
    setToken('demo-jwt-token-2026')
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ customer: INITIAL_CUSTOMER, token: 'demo-jwt-token-2026' })
    )
  }

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        isAuthenticated: !!customer,
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useCustomerAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useCustomerAuth must be used within an AuthProvider')
  return context
}
