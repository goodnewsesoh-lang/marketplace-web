'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { logAuth } from '@/lib/authDebug'
import { StoreIcon } from '@/components/StoreIcon'

export function DashboardView() {
  const router = useRouter()
  const { user, seller, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      logAuth('dashboard: no user, redirecting to login')
      router.replace('/login')
    }
  }, [loading, user, router])

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
  const title = type ? `${type.name} store dashboard` : 'Store dashboard'

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
        <div className="dash-stat"><strong>0</strong><span className="muted small">Products</span></div>
        <div className="dash-stat"><strong>{seller.followers_count}</strong><span className="muted small">Followers</span></div>
        <div className="dash-stat"><strong>0</strong><span className="muted small">Store views</span></div>
      </div>
      <div className="form-card">
        <h2>Your store is live</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Adding products is coming next. You will be able to list items with photos, prices and
          discounts right here.
        </p>
      </div>
    </div>
  )
}
