'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'

import { getBrowserSupabase } from '@/lib/supabaseBrowser'

export type Seller = {
  id: string
  store_name: string
  slug: string
  description: string | null
  followers_count: number
  is_verified: boolean
  store_types: { name: string; slug: string; icon: string } | null
}

type AuthValue = {
  user: User | null
  seller: Seller | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

async function fetchSeller(userId: string): Promise<Seller | null> {
  const supabase = getBrowserSupabase()
  if (!supabase) return null
  const { data } = await supabase
    .from('seller_profiles')
    .select('id, store_name, slug, description, followers_count, is_verified, store_types(name, slug, icon)')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as unknown as Seller | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getBrowserSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const current = data.session?.user ?? null
      setUser(current)
      setSeller(current ? await fetchSeller(current.id) : null)
      if (active) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user ?? null
      setUser(current)
      if (!current) {
        setSeller(null)
        return
      }
      // Load the store outside the callback so sign-in is never blocked.
      setTimeout(() => {
        void fetchSeller(current.id).then((row) => {
          if (active) setSeller(row)
        })
      }, 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const refresh = useCallback(async () => {
    const supabase = getBrowserSupabase()
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    const current = data.user ?? null
    setUser(current)
    setSeller(current ? await fetchSeller(current.id) : null)
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getBrowserSupabase()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setSeller(null)
  }, [])

  const value = useMemo(
    () => ({ user, seller, loading, refresh, signOut }),
    [user, seller, loading, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
