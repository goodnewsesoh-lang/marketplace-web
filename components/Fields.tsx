'use client'

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string | null
  hint?: string
}

export function Field({ label, error, hint, ...props }: FieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={error ? 'input input-error' : 'input'} {...props} />
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string | null
  hint?: string
}

export function AreaField({ label, error, hint, ...props }: AreaProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={4} className={error ? 'input input-error' : 'input'} {...props} />
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string | null
  choices: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, error, choices, placeholder, ...props }: SelectProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className={error ? 'input input-error' : 'input'} {...props}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}
