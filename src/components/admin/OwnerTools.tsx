import { Printer, RotateCcw, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ownerChangePin, ownerDemoFill, ownerResetToday } from '../../lib/api'
import { refreshQueue } from '../../lib/liveQueue'
import { staffLogin } from '../../lib/staff'
import { TextField } from '../Fields'
import PillButton from '../PillButton'
import Sheet from '../Sheet'
import SegmentedControl from './SegmentedControl'
import { ConfirmButtons, Notice, Section } from './ui'
import { ownerError } from './ownerError'

/** [Open printable poster] → /poster. */
export function PosterLink() {
  return (
    <Section title="QR poster" id="poster-title">
      <p className="mb-3 text-small text-muted">A printable A4 poster with a QR code that opens the Join page.</p>
      <PillButton to="/poster">
        <span className="inline-flex items-center gap-2">
          <Printer size={18} aria-hidden="true" /> Open printable poster
        </span>
      </PillButton>
    </Section>
  )
}

type Role = 'staff' | 'owner'

/**
 * Change the Staff or Owner PIN: 4 digits, typed twice, then a confirmation.
 * `locked` (settings.pin_change_locked, the hosted demo) disables it so the published test PINs keep working.
 */
export function PinSettings({ pin, locked = false }: { pin: string; locked?: boolean }) {
  const [role, setRole] = useState<Role>('staff')
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const roleName = role === 'owner' ? 'Owner' : 'Staff'

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setDone(null)
    if (!/^\d{4}$/.test(first)) return setError('A PIN is 4 digits.')
    if (first !== second) return setError("The two PINs don't match.")
    setError(null)
    setConfirming(true)
  }

  async function change() {
    setBusy(true)
    try {
      await ownerChangePin(pin, role, first)
      // The owner's own PIN changed: sign this device in with the new one.
      if (role === 'owner') await staffLogin(first)
      setConfirming(false)
      setFirst('')
      setSecond('')
      setDone(`${roleName} PIN changed.`)
    } catch (err) {
      setConfirming(false)
      setError(ownerError(err))
    } finally {
      setBusy(false)
    }
  }

  const pinInput = { type: 'password', inputMode: 'numeric', autoComplete: 'off', maxLength: 4, className: 'num h-14 w-full min-w-0 bg-transparent text-body font-semibold tracking-[0.4em] text-text outline-none' } as const

  return (
    <Section title="PINs" id="pins-title">
      {locked && (
        <p className="mb-3 rounded-tile bg-surface-2 px-4 py-3 text-small font-semibold text-text">
          PIN changes are turned off on this demo, so the test PINs in the README always work.
        </p>
      )}
      {/* A disabled fieldset turns off every field and button inside it. */}
      <form onSubmit={onSubmit} noValidate>
        <fieldset disabled={locked} className={`flex flex-col gap-3 ${locked ? 'opacity-50' : ''}`}>
          <SegmentedControl
            id="pin-role"
            label="Which PIN"
            options={[
              { value: 'staff', label: 'Staff PIN' },
              { value: 'owner', label: 'Owner PIN' },
            ]}
            value={role}
            onChange={(r) => {
              setRole(r)
              setError(null)
              setDone(null)
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField id="pin-new" label={`New ${roleName} PIN`} {...pinInput} value={first} onChange={(e) => setFirst(e.target.value.replace(/\D/g, '').slice(0, 4))} />
            <TextField id="pin-again" label="Type it again" {...pinInput} value={second} onChange={(e) => setSecond(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </div>
          <Notice text={error} tone="error" />
          <Notice text={done} tone="ok" />
          <PillButton type="submit" disabled={locked || first.length !== 4 || second.length !== 4}>
            Change {roleName} PIN
          </PillButton>
        </fieldset>
      </form>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title={`Change the ${roleName} PIN?`}>
        <p className="text-body">
          {role === 'owner'
            ? 'Other devices signed in with the old Owner PIN will be asked for the new one.'
            : 'Reception and stylist devices will be asked for the new Staff PIN.'}
        </p>
        <ConfirmButtons confirm="Change PIN" onConfirm={() => void change()} onCancel={() => setConfirming(false)} busy={busy} />
      </Sheet>
    </Section>
  )
}

type DemoAction = 'fill' | 'reset'

/** [Fill demo queue] and [Reset today], each behind a confirmation sheet. */
export function DemoTools({ pin }: { pin: string }) {
  const [action, setAction] = useState<DemoAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)

  async function run() {
    if (!action) return
    setBusy(true)
    try {
      if (action === 'fill') {
        const n = await ownerDemoFill(pin)
        setMessage({ text: `Added ${n} demo customers.`, tone: 'ok' })
      } else {
        await ownerResetToday(pin)
        setMessage({ text: "Today's queue has been cleared.", tone: 'ok' })
      }
      await refreshQueue()
    } catch (err) {
      setMessage({ text: ownerError(err), tone: 'error' })
    } finally {
      setBusy(false)
      setAction(null)
    }
  }

  return (
    <Section title="Demo tools" id="demo-title">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAction('fill')}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-small font-bold text-text"
        >
          <Sparkles size={16} aria-hidden="true" /> Fill demo queue
        </button>
        <button
          type="button"
          onClick={() => setAction('reset')}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-small font-bold text-danger"
        >
          <RotateCcw size={16} aria-hidden="true" /> Reset today
        </button>
      </div>
      <Notice text={message?.text ?? null} tone={message?.tone ?? 'ok'} />

      <Sheet open={action !== null} onClose={() => setAction(null)} title={action === 'reset' ? 'Reset today?' : 'Fill the demo queue?'}>
        <p className="text-body">
          {action === 'reset'
            ? "This removes every customer from today's queue and stats. It can't be undone."
            : 'This adds 6 sample customers who joined over the last hour. It only works when the queue is empty.'}
        </p>
        <ConfirmButtons
          confirm={action === 'reset' ? 'Reset today' : 'Fill queue'}
          danger={action === 'reset'}
          onConfirm={() => void run()}
          onCancel={() => setAction(null)}
          busy={busy}
        />
      </Sheet>
    </Section>
  )
}
