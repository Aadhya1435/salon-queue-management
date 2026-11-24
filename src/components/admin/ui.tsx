import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { spring } from '../../styles/motion'

/** A small accessible on/off switch (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  size?: 'md' | 'lg'
}) {
  const lg = size === 'lg'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative flex shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50 ${
        lg ? 'h-10 w-[4.5rem]' : 'h-8 w-14'
      } ${checked ? 'justify-end bg-success' : 'justify-start bg-break'}`}
    >
      <motion.span layout transition={spring.pop} className={`block rounded-full bg-white shadow-card ${lg ? 'size-8' : 'size-6'}`} />
    </button>
  )
}

/** White section card with a title. */
export function Section({ title, action, children, id }: { title: string; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="rounded-card bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={id} className="text-body font-bold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A short line under a form: green when it worked, red when it didn't. */
export function Notice({ text, tone }: { text: string | null; tone: 'ok' | 'error' }) {
  if (!text) return null
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`mt-2 text-caption font-semibold ${tone === 'error' ? 'text-danger' : 'text-success'}`}>
      {text}
    </p>
  )
}

/** Secondary pill (surface-2), used for small actions like "+ Add". */
export function SmallButton({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-small font-semibold text-text transition-transform active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Two buttons at the bottom of a confirmation sheet. */
export function ConfirmButtons({
  confirm,
  onConfirm,
  onCancel,
  busy,
  danger = false,
}: {
  confirm: string
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
  danger?: boolean
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
      <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-full bg-surface-2 text-body font-bold text-text">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        aria-busy={busy}
        className={`h-12 flex-1 rounded-full text-body font-bold disabled:opacity-60 ${danger ? 'bg-danger text-white' : 'bg-primary text-on-primary'}`}
      >
        {busy ? 'Working…' : confirm}
      </button>
    </div>
  )
}
