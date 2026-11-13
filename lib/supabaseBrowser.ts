import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// One shared Supabase client for the browser. It keeps people signed in.
// Returns null if the two environment values are not set.
export function getBrowserSupabase(): SupabaseClient | null {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}
