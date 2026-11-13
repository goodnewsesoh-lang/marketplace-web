'use client'

import { useState } from 'react'

import { Field, AreaField } from '@/components/Fields'
import { EMAIL_REGEX, friendlyDbError } from '@/lib/errors'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

export function RequestTypeForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [wanted, setWanted] = useState('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<{ email?: string; wanted?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    const next: { email?: string; wanted?: string } = {}
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address.'
    if (wanted.trim().length < 2) next.wanted = 'Tell us what you sell.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length > 0) return

    const supabase = getBrowserSupabase()
    if (!supabase) {
      setFormError('The site is not connected to its database yet.')
      return
    }
    setBusy(true)
    const { error } = await supabase.from('store_type_requests').insert({
      email: email.trim(),
      store_type_wanted: wanted.trim(),
      details: details.trim() || null,
    })
    setBusy(false)
    if (error) setFormError(friendlyDbError(error))
    else setDone(true)
  }

  if (done) {
    return (
      <div className="form-card">
        <h2>Request received</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          Thank you. Within a few days we will create a store for what you sell and email you at{' '}
          <strong>{email.trim()}</strong> so you can complete your sign-up.
        </p>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="form-card">
      <h2>Your type is not on the list?</h2>
      <p className="muted" style={{ margin: '8px 0 20px' }}>
        Tell us what you sell and leave your email. We will create a store made for you and email
        you to complete your sign-up.
      </p>
      <Field
        label="Your email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Field
        label="What do you sell?"
        value={wanted}
        onChange={(e) => setWanted(e.target.value)}
        placeholder="e.g. Art prints, podcasts, farm produce"
        error={errors.wanted}
      />
      <AreaField
        label="Anything else we should know? (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
      />
      {formError ? <p className="alert alert-error">{formError}</p> : null}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
          {busy ? 'Sending...' : 'Send request'}
        </button>
      </div>
    </div>
  )
}
