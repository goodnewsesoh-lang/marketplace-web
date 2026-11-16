'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { formatMoney } from '@/lib/currency'
import { friendlyDbError } from '@/lib/errors'
import { itemNoun } from '@/lib/storeTypes'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

type Item = {
  id: string
  name: string
  price: number
  discount_price: number | null
  currency: string | null
  status: string
  views_count: number | null
  saves_count: number | null
  product_images: { image_url: string; sort_order: number }[] | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending review',
  published: 'Live',
  rejected: 'Rejected',
  unavailable: 'Unavailable',
  removed: 'Removed',
}

export function MyProducts() {
  const router = useRouter()
  const { user, seller, loading } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const noun = itemNoun(seller?.store_types?.slug)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase()
    if (!supabase || !seller) return
    const { data, error: e } = await supabase
      .from('products')
      .select('id, name, price, discount_price, currency, status, views_count, saves_count, product_images(image_url, sort_order)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (e) setError(friendlyDbError(e))
    else {
      setError(null)
      setItems((data ?? []) as unknown as Item[])
    }
    setBusy(false)
  }, [seller])

  useEffect(() => {
    if (seller) void load()
    else if (!loading) setBusy(false)
  }, [seller, loading, load])

  const setStatus = async (item: Item, status: string) => {
    const supabase = getBrowserSupabase()
    if (!supabase) return
    setBusyId(item.id)
    setError(null)
    const { error: e } = await supabase
      .from('products')
      .update({ status, availability_status: status === 'unavailable' ? 'unavailable' : 'available' })
      .eq('id', item.id)
    if (e) setError(friendlyDbError(e))
    else setItems((cur) => cur.map((p) => (p.id === item.id ? { ...p, status } : p)))
    setBusyId(null)
  }

  const remove = async (item: Item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const supabase = getBrowserSupabase()
    if (!supabase) return
    setBusyId(item.id)
    const { error: e } = await supabase.from('products').delete().eq('id', item.id)
    if (e) setError(friendlyDbError(e))
    else setItems((cur) => cur.filter((p) => p.id !== item.id))
    setBusyId(null)
  }

  if (loading || !user || busy) {
    return <div className="form-card"><p className="muted">Loading...</p></div>
  }
  if (!seller) {
    return (
      <div className="form-card">
        <h2>Create your store first</h2>
        <Link href="/register" className="btn btn-primary" style={{ marginTop: 16 }}>Create my store</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="list-head">
        <div>
          <Link href="/dashboard" className="link small">← Dashboard</Link>
          <h1 style={{ fontSize: 24 }}>My {noun}s</h1>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-primary btn-small">+ Add {noun}</Link>
      </div>

      {error ? <p className="alert alert-error">{error}</p> : null}

      {items.length === 0 ? (
        <div className="form-card" style={{ marginTop: 16 }}>
          <p className="muted">You have nothing listed yet. Add your first {noun} to get started.</p>
        </div>
      ) : (
        <div className="item-list">
          {items.map((item) => {
            const cover = [...(item.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
            const currency = item.currency ?? 'NGN'
            const locked = item.status === 'rejected' || item.status === 'removed'
            const live = item.status === 'published' || item.status === 'unavailable'
            const disabled = busyId === item.id
            return (
              <div key={item.id} className="item-card">
                <div className="item-top">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="item-thumb" src={cover.image_url} alt="" />
                  ) : (
                    <div className="item-thumb" />
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.discount_price != null ? (
                        <>
                          {formatMoney(item.discount_price, currency)}{' '}
                          <s className="muted">{formatMoney(item.price, currency)}</s>
                        </>
                      ) : (
                        formatMoney(item.price, currency)
                      )}
                    </p>
                    <p className={`status status-${item.status}`}>{STATUS_LABELS[item.status] ?? item.status}</p>
                    <p className="muted small">{item.views_count ?? 0} views · {item.saves_count ?? 0} saves</p>
                  </div>
                </div>
                {locked ? (
                  <p className="error-text">
                    {item.status === 'rejected' ? 'Rejected' : 'Removed'} by the Nexta Shop team.
                  </p>
                ) : (
                  <div className="item-actions">
                    <Link href={`/dashboard/products/${item.id}`} className="btn btn-ghost btn-small">Edit</Link>
                    <button type="button" className="btn btn-ghost btn-small" disabled={disabled}
                      onClick={() => setStatus(item, live ? 'draft' : 'published')}>
                      {live ? 'Unpublish' : 'Publish'}
                    </button>
                    {live ? (
                      <button type="button" className="btn btn-ghost btn-small" disabled={disabled}
                        onClick={() => setStatus(item, item.status === 'unavailable' ? 'published' : 'unavailable')}>
                        {item.status === 'unavailable' ? 'Mark available' : 'Mark unavailable'}
                      </button>
                    ) : null}
                    <button type="button" className="btn btn-ghost btn-small danger" disabled={disabled} onClick={() => remove(item)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
