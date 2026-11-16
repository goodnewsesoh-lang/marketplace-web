export const CURRENCIES = [
  { code: 'NGN', label: 'Naira (NGN)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'Pound (GBP)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GHS', label: 'Ghana Cedi (GHS)' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

export function formatMoney(amount: number, currency: string): string {
  const code = CURRENCIES.some((c) => c.code === currency) ? currency : 'NGN'
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${code} ${amount}`
  }
}

// Accepts "12,500" or "12500.50". Returns NaN for anything else.
export function parseMoney(text: string): number {
  const cleaned = text.replace(/,/g, '').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN
  return Number(cleaned)
}
