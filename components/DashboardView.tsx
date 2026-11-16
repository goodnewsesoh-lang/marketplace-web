'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { StoreIcon } from '@/components/StoreIcon'
import { itemNoun } from '@/lib/storeTypes'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

export function DashboardView() {
  const router = useRouter()
  const { user, seller, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  const [stats, setStats] = useState({ products: 0, views: 0, saves: 0 })
  const sellerId = seller?.id

  useEffect(() => {
    const supabase = getBrowserSupabase()
    if (!supabase || !sellerId) return
    void (async () => {
      const { data } = await supabase
        .from('products')
        .select('views_count, saves_count')
        .eq('seller_id', sellerId)
      const rows = (data ?? []) as { views_count: number | null; saves_count: number | null }[]
      setStats({
        products: rows.length,
        views: rows.reduce((n, r) => n + (r.views_count ?? 0), 0),
        saves: rows.reduce((n, r) => n + (r.saves_count ?? 0), 0),
      })
    })()
  }, [sellerId])

  if (loading || !user) {
    return <div className="form-card"><p className="muted">Loading...</p></div>
  }

  if (!seller) {
    return (
      <div className="form-card">
        <h2>Finish setting up</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          Your account is ready. Create your store to start selling.
        </p>
        <Link href="/register" className="btn btn-primary">Create my store</Link>
      </div>
    )
  }

  const type = seller.store_types
  const title = type ? `${type.name} dashboard` : 'Store dashboard'

  return (
    <div className="dash">
      <div className="dash-head">
        <span className="icon-bubble">
          <StoreIcon name={type?.icon ?? 'grid'} />
        </span>
        <div>
          <p className="eyebrow-dark">{title}</p>
          <h1>{seller.store_name}</h1>
          {seller.description ? <p className="muted">{seller.description}</p> : null}
        </div>
      </div>
      <div className="dash-stats">
        <div className="dash-stat"><strong>{stats.products}</strong><span className="muted small">Items listed</span></div>
        <div className="dash-stat"><strong>{seller.followers_count}</strong><span className="muted small">Followers</span></div>
        <div className="dash-stat"><strong>{stats.views}</strong><span className="muted small">Item views</span></div>
      </div>
      <div className="form-card">
        <h2>Your items</h2>
        <p className="muted" style={{ margin: '8px 0 16px' }}>
          Add a {itemNoun(type?.slug)} with photos, a price in your currency and an optional discount. It goes live straight away.
        </p>
        <div className="progress-actions" style={{ justifyContent: 'flex-start' }}>
          <Link href="/dashboard/products/new" className="btn btn-primary">+ Add {itemNoun(type?.slug)}</Link>
          <Link href="/dashboard/products" className="btn btn-ghost">My {itemNoun(type?.slug)}s</Link>
        </div>
      </div>
    </div>
  )
}
