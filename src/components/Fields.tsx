import { useLayoutEffect, useRef, type ChangeEvent, type InputHTMLAttributes } from 'react'
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

/** Where the caret goes in `formatted` so that `digitsBefore` digits sit before it. */
function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++seen === digitsBefore) return i + 1
  }
  return formatted.length
}

/** +91 mobile number on the numeric keypad, shown as "98765 43210" while typing. */
export function PhoneField({ id, label = 'Phone', digits, onDigits, onBlur, error, autoFocus }: PhoneFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // The caret position (as "digits before it") to restore after the number is re-formatted.
  const pendingCaret = useRef<number | null>(null)

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value
    const caret = e.target.selectionStart ?? typed.length
    let digitsBefore = typed.slice(0, caret).replace(/\D/g, '').length
    let next = phoneDigits(typed)
    // Backspace on the space only removes the space, which the formatting puts straight back:
    // delete the digit before it instead.
    if (next === digits && typed.length < formatPhoneInput(digits).length && digitsBefore > 0) {
      next = digits.slice(0, digitsBefore - 1) + digits.slice(digitsBefore)
      digitsBefore -= 1
    }
    if (next === digits) return // nothing changed (e.g. an 11th digit): React puts the old value back
    pendingCaret.current = Math.min(digitsBefore, next.length)
    onDigits(next)
  }

  // Keep the caret where the person is typing instead of jumping to the end.
  useLayoutEffect(() => {
    const el = inputRef.current
    const want = pendingCaret.current
    pendingCaret.current = null
    if (!el || want === null || document.activeElement !== el) return
    const pos = caretAfterDigits(el.value, want)
    el.setSelectionRange(pos, pos)
  })

  return (
    <Frame id={id} label={label} error={error}>
      <span className="num mr-2 text-body font-semibold text-muted">+91</span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98765 43210"
        ref={inputRef}
        value={formatPhoneInput(digits)}
        onChange={onChange}
        onBlur={onBlur}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`num ${inputClasses}`}
      />
    </Frame>
  )
}
