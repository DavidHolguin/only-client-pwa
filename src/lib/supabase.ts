import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqeoxruodotrgpmipivj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZW94cnVvZG90cmdwbWlwaXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzUzMDMsImV4cCI6MjA4MjAxMTMwM30.pVbxqqqIt02axf4kmOZVY8yoLxqZqZ9oTTwTUKFfcX0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'only_customer_auth_token',
  },
})
