export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export const NETWORK_MESSAGE =
  'We could not reach the server. Check your internet connection and try again.'

export function isNetworkError(e: unknown): boolean {
  const text = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  const m = text.toLowerCase()
  return m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')
}

// Turns technical sign-in messages into friendly ones.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'That email is already registered. Try logging in instead.'
  if (m.includes('database error saving new user'))
    return 'That username is already taken or not allowed. Please choose another.'
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  if (m.includes('password') && m.includes('character')) return 'Your password is too short.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a few minutes and try again.'
  if (isNetworkError(message)) return NETWORK_MESSAGE
  return 'Something went wrong. Please try again.'
}

// Turns database errors into friendly ones.
export function friendlyDbError(e: { code?: string; message?: string } | null | undefined): string {
  if (!e) return 'Something went wrong. Please try again.'
  if (isNetworkError(e.message ?? '')) return NETWORK_MESSAGE
  if (e.code === '23505') return 'That name is already taken. Please try another.'
  if (e.code === '23514') return 'One of the details is not allowed. Please check and try again.'
  if (e.code === '42501') return 'You do not have permission to do that.'
  return 'Something went wrong. Please try again.'
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || 'store'
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}
