'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AreaField, Field, SelectField } from '@/components/Fields'
import { useAuth } from '@/components/AuthProvider'
import { CURRENCIES, parseMoney } from '@/lib/currency'
import { NETWORK_MESSAGE, friendlyDbError, isNetworkError, randomSuffix, slugify } from '@/lib/errors'
import { MAX_PHOTOS, compressImage } from '@/lib/images'
import { NEEDS_CONDITION, extraFieldsFor } from '@/lib/productFields'
import { itemNoun } from '@/lib/storeTypes'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

type Photo = {
  key: string
  url: string // preview or saved url
  file?: File // present only for new photos
  imageId?: string // present only for saved photos
}

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const { user, seller, loading } = useAuth()
  const typeSlug = seller?.store_types?.slug ?? 'general'
  const noun = itemNoun(typeSlug)
  const extraFields = extraFieldsFor(typeSlug)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [condition, setCondition] = useState('new')
  const [location, setLocation] = useState('')
  const [delivery, setDelivery] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [allowSharing, setAllowSharing] = useState(true)
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<Photo[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [status, setStatus] = useState('published')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId))
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  // Load an existing product for editing.
  useEffect(() => {
    if (!productId || !seller) return
    const supabase = getBrowserSupabase()
    if (!supabase) return
    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, description, price, discount_price, currency, condition, location, delivery, negotiable, allow_sharing, extras, status, seller_id, product_images(id, image_url, sort_order)',
        )
        .eq('id', productId)
        .eq('seller_id', seller.id)
        .maybeSingle()
      if (!active) return
      if (error || !data) {
        setLoadError('We could not find that item.')
        setLoadingProduct(false)
        return
      }
      const row = data as unknown as {
        name: string
        description: string | null
        price: number
        discount_price: number | null
        currency: string | null
        condition: string | null
        location: string | null
        delivery: string | null
        negotiable: boolean | null
        allow_sharing: boolean | null
        extras: Record<string, string> | null
        status: string
        product_images: { id: string; image_url: string; sort_order: number }[] | null
      }
      setName(row.name)
      setDescription(row.description ?? '')
      setPrice(String(row.price))
      setDiscount(row.discount_price != null ? String(row.discount_price) : '')
      setCurrency(row.currency ?? 'NGN')
      setCondition(row.condition ?? 'new')
      setLocation(row.location ?? '')
      setDelivery(row.delivery ?? '')
      setNegotiable(Boolean(row.negotiable))
      setAllowSharing(row.allow_sharing !== false)
      setExtras(row.extras ?? {})
      setStatus(row.status)
      setPhotos(
        [...(row.product_images ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => ({ key: img.id, url: img.image_url, imageId: img.id })),
      )
      setLoadingProduct(false)
    })()
    return () => {
      active = false
    }
  }, [productId, seller])

  // Free preview memory when leaving.
  const photosRef = useRef<Photo[]>([])
  photosRef.current = photos
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url))
    },
    [],
  )

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const room = MAX_PHOTOS - photos.length
    const chosen = Array.from(list).slice(0, Math.max(0, room))
    const added: Photo[] = chosen
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, url: URL.createObjectURL(file), file }))
    if (list.length > room) setErrors((e) => ({ ...e, photos: `You can add up to ${MAX_PHOTOS} photos.` }))
    else setErrors((e) => ({ ...e, photos: '' }))
    setPhotos((p) => [...p, ...added])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (photo: Photo) => {
    if (photo.imageId) setRemovedIds((ids) => [...ids, photo.imageId as string])
    if (photo.file) URL.revokeObjectURL(photo.url)
    setPhotos((p) => p.filter((x) => x.key !== photo.key))
  }

  const makeCover = (photo: Photo) => setPhotos((p) => [photo, ...p.filter((x) => x.key !== photo.key)])

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    const priceValue = parseMoney(price)
    const discountValue = parseMoney(discount)
    if (name.trim().length < 2 || name.trim().length > 100) next.name = 'Name must be 2 to 100 characters.'
    if (description.trim().length < 10) next.description = 'Describe it in at least 10 characters.'
    if (!Number.isFinite(priceValue)) next.price = 'Enter a valid price, for example 12500.'
    if (discount.trim()) {
      if (!Number.isFinite(discountValue)) next.discount = 'Enter a valid discount price.'
      else if (Number.isFinite(priceValue) && discountValue >= priceValue)
        next.discount = 'The discount price must be lower than the price.'
    }
    if (photos.length === 0) next.photos = 'Add at least one photo.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async (mode: 'publish' | 'draft' | 'keep') => {
    if (!user || !seller) return
    setFormError(null)
    if (!validate()) return
    const supabase = getBrowserSupabase()
    if (!supabase) {
      setFormError('The site is not connected to its database yet.')
      return
    }

    const nextStatus = mode === 'keep' ? status : mode === 'publish' ? 'published' : 'draft'
    setSaving(true)
    setProgress('Saving details...')
    try {
      const cleanExtras: Record<string, string> = {}
      for (const f of extraFields) {
        const v = (extras[f.key] ?? '').trim()
        if (v) cleanExtras[f.key] = v
      }
      const fields = {
        name: name.trim(),
        description: description.trim(),
        price: parseMoney(price),
        discount_price: discount.trim() ? parseMoney(discount) : null,
        currency,
        condition: NEEDS_CONDITION.has(typeSlug) ? condition : 'new',
        location: location.trim() || null,
        delivery: delivery.trim() || null,
        negotiable,
        allow_sharing: allowSharing,
        extras: cleanExtras,
        // A new item stays a draft until its photos are uploaded.
        status: !productId && nextStatus === 'published' ? 'draft' : nextStatus,
        availability_status: nextStatus === 'unavailable' ? 'unavailable' : 'available',
      }

      let id = productId ?? null
      if (id) {
        const { error } = await supabase.from('products').update(fields).eq('id', id)
        if (error) throw error
      } else {
        let lastError: { code?: string; message?: string } | null = null
        for (let attempt = 0; attempt < 2 && !id; attempt++) {
          const { data, error } = await supabase
            .from('products')
            .insert({ ...fields, seller_id: seller.id, slug: `${slugify(name)}-${randomSuffix()}` })
            .select('id')
            .single()
          lastError = error
          if (!error && data) id = (data as { id: string }).id
          else if (error && error.code !== '23505') break
        }
        if (!id) throw lastError ?? new Error('save_failed')
      }

      // Upload new photos one by one, so a failure names the photo that failed.
      const finalRows: { id: string; sort: number }[] = []
      const newRows: { product_id: string; image_url: string; sort_order: number }[] = []
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (photo.imageId) {
          finalRows.push({ id: photo.imageId, sort: i })
          continue
        }
        setProgress(`Uploading photo ${i + 1} of ${photos.length}...`)
        const blob = await compressImage(photo.file as File)
        const path = `${user.id}/${id}/photo-${Date.now()}-${i}.jpg`
        const { error: upErr } = await supabase.storage
          .from('products')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw new Error(`upload: ${upErr.message}`)
        const publicUrl = supabase.storage.from('products').getPublicUrl(path).data.publicUrl
        newRows.push({ product_id: id, image_url: publicUrl, sort_order: i })
      }

      setProgress('Finishing...')
      if (newRows.length) {
        const { error } = await supabase.from('product_images').insert(newRows)
        if (error) throw error
      }
      for (const row of finalRows) {
        await supabase.from('product_images').update({ sort_order: row.sort }).eq('id', row.id)
      }
      if (removedIds.length) {
        const { error } = await supabase.from('product_images').delete().in('id', removedIds)
        if (error) throw error
      }
      if (!productId && nextStatus === 'published') {
        const { error } = await supabase.from('products').update({ status: 'published' }).eq('id', id)
        if (error) throw error
      }
      router.push('/dashboard/products')
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      if (message === 'too_large') setFormError('One of the photos is too large. Use photos under 15 MB.')
      else if (message === 'not_image') setFormError('One of the files is not a photo.')
      else if (message.startsWith('upload:'))
        setFormError(
          `A photo could not be uploaded (${message.slice(7)}). Your details were saved as a draft; tap save again to retry.`,
        )
      else if (isNetworkError(e)) setFormError(NETWORK_MESSAGE)
      else setFormError(friendlyDbError(e as { code?: string; message?: string }))
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  if (loading || !user || loadingProduct) {
    return (
      <div className="form-card">
        <p className="muted">Loading...</p>
      </div>
    )
  }
  if (!seller) {
    return (
      <div className="form-card">
        <h2>Create your store first</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>You need a store before you can add items.</p>
        <Link href="/register" className="btn btn-primary">Create my store</Link>
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="form-card">
        <h2>{loadError}</h2>
        <Link href="/dashboard/products" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to my items
        </Link>
      </div>
    )
  }

  const editing = Boolean(productId)
  const live = status === 'published' || status === 'unavailable'

  return (
    <div className="form-card">
      <h2>{editing ? `Edit ${noun}` : `Add a ${noun}`}</h2>

      <div className="field" style={{ marginTop: 18 }}>
        <label>Photos ({photos.length}/{MAX_PHOTOS})</label>
        <div className="photo-grid">
          {photos.map((p, i) => (
            <div key={p.key} className="photo-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
              {i === 0 ? <span className="photo-badge">Cover</span> : null}
              <div className="photo-actions">
                {i > 0 ? (
                  <button type="button" onClick={() => makeCover(p)} aria-label="Make cover photo">★</button>
                ) : null}
                <button type="button" onClick={() => removePhoto(p)} aria-label="Remove photo">✕</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
              + Add photo
            </button>
          ) : null}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        {errors.photos ? <p className="error-text">{errors.photos}</p> : <p className="hint">The first photo is the cover. Tap ★ on another to make it the cover.</p>}
      </div>

      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={100} />
      <AreaField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} maxLength={2000} />

      {extraFields.map((f) =>
        f.options ? (
          <SelectField
            key={f.key}
            label={f.label}
            value={extras[f.key] ?? ''}
            onChange={(e) => setExtras({ ...extras, [f.key]: e.target.value })}
            choices={f.options.map((o) => ({ value: o, label: o }))}
            placeholder="Choose"
          />
        ) : (
          <Field
            key={f.key}
            label={`${f.label} (optional)`}
            placeholder={f.placeholder}
            value={extras[f.key] ?? ''}
            onChange={(e) => setExtras({ ...extras, [f.key]: e.target.value })}
            maxLength={80}
          />
        ),
      )}

      <div className="row-2">
        <SelectField
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          choices={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
        />
        <Field label="Price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} placeholder="12500" />
      </div>
      <Field
        label="Discount price (optional)"
        inputMode="decimal"
        value={discount}
        onChange={(e) => setDiscount(e.target.value)}
        error={errors.discount}
        hint="Must be lower than the price. Buyers see the old price crossed out."
      />

      {NEEDS_CONDITION.has(typeSlug) ? (
        <SelectField label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)} choices={CONDITIONS} />
      ) : null}
      <Field label="City or location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos" maxLength={80} />
      <Field label="Delivery (optional)" value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="e.g. Nationwide delivery, pickup only" maxLength={120} />

      <label className="check">
        <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
        <span>Price is negotiable</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={allowSharing} onChange={(e) => setAllowSharing(e.target.checked)} />
        <span>Allow sharing (people can share a link to this item)</span>
      </label>

      {formError ? <p className="alert alert-error">{formError}</p> : null}
      {progress ? <p className="muted small center-text">{progress}</p> : null}

      <div className="form-actions">
        <Link href="/dashboard/products" className="btn btn-ghost">Cancel</Link>
        <span className="actions-right">
          {!editing || !live ? (
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => save(editing ? 'keep' : 'draft')}>
              {editing ? 'Save' : 'Save draft'}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(editing && live ? 'keep' : 'publish')}>
            {saving ? 'Saving...' : editing && live ? 'Save changes' : 'Publish'}
          </button>
        </span>
      </div>
    </div>
  )
}
