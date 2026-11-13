'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuth } from './AuthProvider'

export function AuthNav() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) return <span className="auth-nav" aria-hidden="true" />

  if (user) {
    return (
      <span className="auth-nav">
        <Link href="/dashboard" className="btn btn-primary btn-small">
          Dashboard
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={async () => {
            await signOut()
            router.push('/')
          }}
        >
          Log out
        </button>
      </span>
    )
  }

  return (
    <span className="auth-nav">
      <Link href="/login" className="btn btn-ghost btn-small">
        Log in
      </Link>
      <Link href="/register" className="btn btn-primary btn-small">
        Open your store
      </Link>
    </span>
  )
}
