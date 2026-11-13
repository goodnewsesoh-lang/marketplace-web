'use client'

export type ProgressStep = { key: string; label: string }
export type ProgressStatus = 'running' | 'success' | 'error'

type Props = {
  steps: ProgressStep[]
  index: number
  status: ProgressStatus
  slow: boolean
  message: string | null
  onRetry: () => void
  onEdit: () => void
}

const svgProps = {
  width: 40,
  height: 40,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function StepIcon({ stepKey }: { stepKey: string }) {
  switch (stepKey) {
    case 'account':
      return (
        <svg {...svgProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      )
    case 'access':
      return (
        <svg {...svgProps}>
          <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'store':
      return (
        <svg {...svgProps}>
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          <path d="M5 12v8h14v-8" />
        </svg>
      )
    default:
      return (
        <svg {...svgProps}>
          <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
        </svg>
      )
  }
}

export function ProgressScreen({ steps, index, status, slow, message, onRetry, onEdit }: Props) {
  const current = steps[Math.min(index, steps.length - 1)]

  return (
    <div className="progress" role="status" aria-live="polite">
      {status === 'success' ? (
        <>
          <svg className="success-mark" viewBox="0 0 52 52" aria-hidden="true">
            <circle className="success-circle" cx="26" cy="26" r="24" />
            <path className="success-check" d="M14 27l8 8 16-17" />
          </svg>
          <h2>Your store is ready</h2>
          <p className="muted">Opening your dashboard...</p>
        </>
      ) : status === 'error' ? (
        <>
          <div className="progress-icon progress-icon-error" aria-hidden="true">
            <svg {...svgProps}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          </div>
          <h2>That did not work</h2>
          <p className="error-text">{message}</p>
          <div className="progress-actions">
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Try again
            </button>
            <button type="button" className="btn btn-ghost" onClick={onEdit}>
              Edit my details
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="progress-icon" key={current.key}>
            <StepIcon stepKey={current.key} />
          </div>
          <h2 key={`${current.key}-label`} className="progress-label">
            {current.label}
            <span className="dots" aria-hidden="true">
              <i>.</i>
              <i>.</i>
              <i>.</i>
            </span>
          </h2>
          {slow ? (
            <p className="slow-note">Taking longer than usual. Check your internet connection.</p>
          ) : (
            <p className="muted">Please keep this page open.</p>
          )}
        </>
      )}

      <div className="progress-dots" aria-hidden="true">
        {steps.map((step, i) => (
          <span
            key={step.key}
            className={status === 'success' || i < index ? 'pdot pdot-done' : i === index ? 'pdot pdot-now' : 'pdot'}
          />
        ))}
      </div>
    </div>
  )
}
