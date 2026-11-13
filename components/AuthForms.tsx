'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Field } from '@/components/Fields'
import { useAuth } from '@/components/AuthProvider'
import { EMAIL_REGEX, NETWORK_MESSAGE, friendlyAuthError, isNetworkError } from '@/lib/errors'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

export function LoginForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: { email?: string; password?: string } = {}
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return
    const supabase = getBrowserSupabase()
    if (!supabase) {
      setFormError('The site is not connected to its database yet.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setFormError(friendlyAuthError(error.message))
      else router.replace('/dashboard')
    } catch (err) {
      setFormError(isNetworkError(err) ? NETWORK_MESSAGE : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <h2>Welcome back</h2>
      <p className="muted" style={{ margin: '8px 0 18px' }}>Log in to manage your store.</p>
      <Field label="Email" type="email" autoComplete="email" value={email}
        onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Field label="Password" type="password" autoComplete="current-password" value={password}
        onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      {formError ? <p className="alert alert-error">{formError}</p> : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Logging in...' : 'Log in'}
      </button>
      <p className="muted small center-text"><a href="/forgot-password" className="link">Forgot password?</a></p>
      <p className="muted small center-text">
        New here? <a href="/register" className="link">Open your store</a>
      </p>
    </form>
  )
}

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    const supabase = getBrowserSupabase()
    if (!supabase) {
      setError('The site is not connected to its database yet.')
      return
    }
    setBusy(true)
    try {
      const { error: e2 } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (e2) setError(friendlyAuthError(e2.message))
      else setSent(true)
    } catch (err) {
      setError(isNetworkError(err) ? NETWORK_MESSAGE : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  if (sent) {
    return (
      <div className="form-card">
        <h2>Check your email</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          If an account exists for <strong>{email.trim()}</strong>, we sent a link to reset your password.
        </p>
        <a href="/login" className="btn btn-primary">Back to log in</a>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <h2>Reset your password</h2>
      <p className="muted" style={{ margin: '8px 0 18px' }}>We will email you a reset link.</p>
      <Field label="Email" type="email" autoComplete="email" value={email}
        onChange={(e) => setEmail(e.target.value)} />
      {error ? <p className="alert alert-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}

export function ResetForm() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    const supabase = getBrowserSupabase()
    if (!supabase) return
    setBusy(true)
    try {
      const { error: e2 } = await supabase.auth.updateUser({ password })
      if (e2) setError(friendlyAuthError(e2.message))
      else {
        setDone(true)
        setTimeout(() => router.replace('/dashboard'), 1500)
      }
    } catch (err) {
      setError(isNetworkError(err) ? NETWORK_MESSAGE : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  if (loading) return <div className="form-card"><p className="muted">Loading...</p></div>

  if (!user) {
    return (
      <div className="form-card">
        <h2>Link expired</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          This reset link is invalid or has expired. Request a new one.
        </p>
        <a href="/forgot-password" className="btn btn-primary">Request new link</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="form-card">
        <h2>Password updated</h2>
        <p className="muted" style={{ marginTop: 8 }}>Taking you to your dashboard...</p>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <h2>Choose a new password</h2>
      <Field label="New password" type="password" autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." />
      {error ? <p className="alert alert-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Saving...' : 'Update password'}
      </button>
    </form>
  )
}
