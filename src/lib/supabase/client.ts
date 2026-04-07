import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your_'))

export function createClientSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured')
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
