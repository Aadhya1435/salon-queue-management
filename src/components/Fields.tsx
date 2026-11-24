import type { InputHTMLAttributes } from 'react'
import { formatPhoneInput, phoneDigits } from '../lib/joinForm'

const inputClasses =
  'h-14 w-full min-w-0 bg-transparent text-body font-semibold text-text outline-none placeholder:font-medium placeholder:text-muted/70'

function Frame({ id, label, error, children }: { id: string; label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-muted">
        {label}
      </label>
      <div
        className={`flex items-center rounded-input bg-surface px-4 shadow-card ring-2 transition-shadow focus-within:ring-primary ${
          error ? 'ring-danger' : 'ring-transparent'
        }`}
      >
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-caption font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = { id: string; label: string; error?: string | null } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>

export function TextField({ id, label, error, ...input }: TextFieldProps) {
  return (
    <Frame id={id} label={label} error={error}>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClasses} {...input} />
    </Frame>
  )
}

type PhoneFieldProps = {
  id: string
  label?: string
  /** Digits only, e.g. "9876543210". */
  digits: string
  onDigits: (digits: string) => void
  onBlur?: () => void
  error?: string | null
  autoFocus?: boolean
}

/** +91 mobile number on the numeric keypad, shown as "98765 43210" while typing. */
export function PhoneField({ id, label = 'Phone', digits, onDigits, onBlur, error, autoFocus }: PhoneFieldProps) {
  return (
    <Frame id={id} label={label} error={error}>
      <span className="num mr-2 text-body font-semibold text-muted">+91</span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98765 43210"
        value={formatPhoneInput(digits)}
        onChange={(e) => onDigits(phoneDigits(e.target.value))}
        onBlur={onBlur}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`num ${inputClasses}`}
      />
    </Frame>
  )
}
