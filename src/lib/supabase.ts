import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** False when .env.local (or the Vercel env vars) are missing. */
export const isSupabaseConfigured = Boolean(url && key)

if (!isSupabaseConfigured) {
  console.error('Supabase keys are missing. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
}

/**
 * The browser only READS tables and calls database functions (rpc).
 * It never writes tables directly; see supabase/migrations/.
 */
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false },
})
