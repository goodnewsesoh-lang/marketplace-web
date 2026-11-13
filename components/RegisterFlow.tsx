'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Field, AreaField } from '@/components/Fields'
import { ProgressScreen, type ProgressStatus, type ProgressStep } from '@/components/ProgressScreen'
import { RequestTypeForm } from '@/components/RequestTypeForm'
import { StoreIcon } from '@/components/StoreIcon'
import { useAuth } from '@/components/AuthProvider'
import {
  EMAIL_REGEX,
  NETWORK_MESSAGE,
  USERNAME_REGEX,
  friendlyAuthError,
  friendlyDbError,
  isNetworkError,
  randomSuffix,
  slugify,
} from '@/lib/errors'
import type { StoreType } from '@/lib/storeTypes'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

const STEPS: ProgressStep[] = [
  { key: 'account', label: 'Registering account' },
  { key: 'access', label: 'Granting access' },
  { key: 'store', label: 'Creating storefront' },
  { key: 'finish', label: 'Almost done' },
]

const OTHER = '__other'
const MIN_STEP_MS = 700
const SLOW_AFTER_MS = 10000

type Phase = 'form' | 'progress' | 'confirm' | 'request'

class FlowError extends Error {
  step: number
  constructor(message: string, step: number) {
    super(message)
    this.step = step
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function RegisterFlow({ types, initialType }: { types: StoreType[]; initialType?: string }) {
  const router = useRouter()
  const { user, seller, loading, refresh } = useAuth()

  const [phase, setPhase] = useState<Phase>('form')
  const [step, setStep] = useState(1)
  const [typeSlug, setTypeSlug] = useState<string | null>(
    initialType && types.some((t) => t.slug === initialType) ? initialType : null,
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<ProgressStatus>('running')
  const [slow, setSlow] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const userIdRef = useRef<string | null>(null)
  const currentRef = useRef(0)
  const failedRef = useRef(0)

  const hasAccount = Boolean(user) || userIdRef.current !== null
  const lastStep = 3
  const firstStep = user ? 3 : 1

  // Someone who already has a store goes straight to the dashboard.
  useEffect(() => {
    if (phase === 'form' && !loading && seller) router.replace('/dashboard')
  }, [phase, loading, seller, router])

  // Someone already signed in without a store only needs to finish the store details.
  useEffect(() => {
    if (!loading && user && phase === 'form' && step < 3) setStep(3)
  }, [loading, user, phase, step])

  // Show a gentle warning if one step takes too long.
  useEffect(() => {
    if (phase !== 'progress' || status !== 'running') {
      setSlow(false)
      return
    }
    setSlow(false)
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [phase, status, index])

  const go = (i: number) => {
    currentRef.current = i
    setIndex(i)
  }

  async function run(from: number) {
    const supabase = getBrowserSupabase()
    if (!supabase) {
      setMessage('The site is not connected to its database yet.')
      setStatus('error')
      setPhase('progress')
      return
    }

    setPhase('progress')
    setStatus('running')
    setMessage(null)

    try {
      let userId = userIdRef.current ?? user?.id ?? null

      if (from <= 0) {
        go(0)
        const started = Date.now()
        if (!userId) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { username, display_name: username } },
          })
          if (error) throw new FlowError(friendlyAuthError(error.message), 0)
          userId = data.user?.id ?? null
          userIdRef.current = userId
          if (!data.session) {
            setPhase('confirm')
            return
          }
        }
        await wait(Math.max(0, MIN_STEP_MS - (Date.now() - started)))
      }

      if (from <= 1) {
        go(1)
        const started = Date.now()
        if (!userId) throw new FlowError('Your account could not be found. Please try again.', 0)
        let found = false
        for (let attempt = 0; attempt < 6 && !found; attempt++) {
          const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
          if (data) found = true
          else await wait(400)
        }
        if (!found) throw new FlowError('Your account is not ready yet. Please try again.', 1)
        await wait(Math.max(0, MIN_STEP_MS - (Date.now() - started)))
      }

      if (from <= 2) {
        go(2)
        const started = Date.now()
        const chosen = types.find((t) => t.slug === typeSlug)
        const { data: typeRow } = await supabase
          .from('store_types')
          .select('id')
          .eq('slug', typeSlug ?? '')
          .maybeSingle()

        let created = false
        let lastError: { code?: string; message?: string } | null = null
        for (let attempt = 0; attempt < 2 && !created; attempt++) {
          const { error } = await supabase.from('seller_profiles').insert({
            user_id: userId,
            store_name: storeName.trim(),
            slug: `${slugify(storeName)}-${randomSuffix()}`,
            description: description.trim() || null,
            seller_category: chosen?.slug ?? null,
            store_type_id: (typeRow as { id: string } | null)?.id ?? null,
          })
          if (!error) created = true
          else {
            lastError = error
            if (error.code !== '23505') break
          }
        }
        if (!created) {
          // A store already exists for this account (for example after a retry): carry on.
          if (lastError?.code === '23505') {
            const { data: existing } = await supabase
              .from('seller_profiles')
              .select('id')
              .eq('user_id', userId ?? '')
              .maybeSingle()
            if (!existing) throw new FlowError(friendlyDbError(lastError), 2)
          } else {
            throw new FlowError(friendlyDbError(lastError), 2)
          }
        }
        await wait(Math.max(0, MIN_STEP_MS - (Date.now() - started)))
      }

      go(3)
      await refresh()
      await wait(MIN_STEP_MS)
      setStatus('success')
      setTimeout(() => router.push('/dashboard'), 1700)
    } catch (e) {
      failedRef.current = e instanceof FlowError ? e.step : currentRef.current
      setMessage(
        e instanceof FlowError ? e.message : isNetworkError(e) ? NETWORK_MESSAGE : 'Something went wrong. Please try again.',
      )
      setStatus('error')
    }
  }

  const editDetails = () => {
    setPhase('form')
    setStep(hasAccount ? 3 : failedRef.current === 0 ? 2 : 3)
  }

  const validateStep = async (n: number): Promise<boolean> => {
    const next: Record<string, string> = {}
    setFormError(null)

    if (n === 1 && !typeSlug) setFormError('Choose the store type that fits what you sell.')

    if (n === 2) {
      if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address.'
      if (password.length < 8) next.password = 'Use at least 8 characters.'
      if (!USERNAME_REGEX.test(username))
        next.username = 'Use 3 to 30 letters, numbers or underscores, no spaces.'
      if (!next.username) {
        const supabase = getBrowserSupabase()
        if (supabase) {
          setChecking(true)
          const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
          setChecking(false)
          if (data) next.username = 'That username is already taken.'
        }
      }
    }

    if (n === 3) {
      const name = storeName.trim()
      if (name.length < 2 || name.length > 60) next.storeName = 'Store name must be 2 to 60 characters.'
      if (description.length > 300) next.description = 'Keep the description under 300 characters.'
    }

    setErrors(next)
    return Object.keys(next).length === 0 && !(n === 1 && !typeSlug)
  }

  const onContinue = async () => {
    if (step === 1 && typeSlug === OTHER) {
      setPhase('request')
      return
    }
    if (!(await validateStep(step))) return
    if (step < lastStep) {
      setStep(step === 1 && user ? 3 : step + 1)
      return
    }
    void run(user || userIdRef.current ? 2 : 0)
  }

  if (loading) {
    return (
      <div className="form-card">
        <p className="muted">Loading...</p>
      </div>
    )
  }

  if (phase === 'request') {
    return <RequestTypeForm onBack={() => setPhase('form')} />
  }

  if (phase === 'confirm') {
    return (
      <div className="form-card">
        <h2>Check your email</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          We sent a confirmation link to <strong>{email.trim()}</strong>. Open it, then log in to
          finish creating your store.
        </p>
        <a href="/login" className="btn btn-primary">
          Go to log in
        </a>
      </div>
    )
  }

  if (phase === 'progress') {
    return (
      <div className="form-card form-card-center">
        <ProgressScreen
          steps={STEPS}
          index={index}
          status={status}
          slow={slow}
          message={message}
          onRetry={() => void run(failedRef.current)}
          onEdit={editDetails}
        />
      </div>
    )
  }

  const stepCount = user ? 1 : 3
  const stepNumber = user ? 1 : step

  return (
    <div className="form-card">
      <div className="stepper" aria-label={`Step ${stepNumber} of ${stepCount}`}>
        {Array.from({ length: stepCount }).map((_, i) => (
          <span key={i} className={i < stepNumber ? 'stepper-bar stepper-on' : 'stepper-bar'} />
        ))}
      </div>
      <p className="muted small">
        Step {stepNumber} of {stepCount}
      </p>

      {step === 1 ? (
        <>
          <h2>What will you sell?</h2>
          <p className="muted" style={{ margin: '8px 0 18px' }}>
            Pick a store type. Your store and dashboard are built for it.
          </p>
          <div className="type-list">
            {types.map((t) => (
              <button
                key={t.slug}
                type="button"
                className="type-option"
                aria-pressed={typeSlug === t.slug}
                onClick={() => setTypeSlug(t.slug)}
              >
                <span className="icon-bubble icon-bubble-small">
                  <StoreIcon name={t.icon} />
                </span>
                <span>
                  <strong>{t.name}</strong>
                  {t.tagline ? <span className="muted small block">{t.tagline}</span> : null}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="type-option"
              aria-pressed={typeSlug === OTHER}
              onClick={() => setTypeSlug(OTHER)}
            >
              <span className="icon-bubble icon-bubble-small">
                <StoreIcon name="grid" />
              </span>
              <span>
                <strong>My type isn&apos;t here</strong>
                <span className="muted small block">Tell us and we will create one for you.</span>
              </span>
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h2>Create your account</h2>
          <p className="muted" style={{ margin: '8px 0 18px' }}>
            You will use this to log in and manage your store.
          </p>
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Field
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            error={errors.username}
            hint="Letters, numbers and underscores only."
          />
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters."
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h2>Set up your store</h2>
          <p className="muted" style={{ margin: '8px 0 18px' }}>
            You can change these later.
          </p>
          <Field
            label="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            error={errors.storeName}
            placeholder="e.g. Ada's Records"
          />
          <AreaField
            label="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            maxLength={300}
          />
        </>
      ) : null}

      {formError ? <p className="alert alert-error">{formError}</p> : null}

      <div className="form-actions">
        {step > firstStep ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={onContinue} disabled={checking}>
          {checking ? 'Checking...' : step === lastStep ? 'Create my store' : 'Continue'}
        </button>
      </div>

      {!user && step === 1 ? (
        <p className="muted small center-text">
          Already have an account? <a href="/login" className="link">Log in</a>
        </p>
      ) : null}
    </div>
  )
}
