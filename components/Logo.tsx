import { SITE_NAME } from '@/lib/config'

// Placeholder logo drawn in code. Replace with the real logo file when it is ready.
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D46FFD" />
            <stop offset="1" stopColor="#6D5BDE" />
          </linearGradient>
        </defs>
        <path d="M12 19h24l3 21H9l3-21z" fill="url(#logo-gradient)" />
        <path
          d="M18 19v-3a6 6 0 0 1 12 0v3"
          fill="none"
          stroke="url(#logo-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="logo-text">{SITE_NAME}</span>
    </span>
  )
}
