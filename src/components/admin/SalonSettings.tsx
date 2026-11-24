import { useState, type FormEvent } from 'react'
import { ownerUpdateSettings } from '../../lib/api'
import { refreshQueue } from '../../lib/liveQueue'
import type { Settings } from '../../lib/types'
import { TextField } from '../Fields'
import PillButton from '../PillButton'
import { Notice, Section } from './ui'
import { ownerError } from './ownerError'

const hhmm = (t: string) => t.slice(0, 5)

type Values = { name: string; open: string; close: string }
const values = (s: Settings): Values => ({ name: s.salon_name, open: hhmm(s.open_time), close: hhmm(s.close_time) })
const sameValues = (a: Values, b: Values) => a.name === b.name && a.open === b.open && a.close === b.close

/** Salon name and opening hours → owner_update_settings. */
export default function SalonSettings({ pin, settings }: { pin: string; settings: Settings }) {
  const [name, setName] = useState(settings.salon_name)
  const [open, setOpen] = useState(hhmm(settings.open_time))
  const [close, setClose] = useState(hhmm(settings.close_time))
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  // The saved values this form started from. Another device (or this one) saving moves them on.
  const [base, setBase] = useState(() => values(settings))
  const [changedElsewhere, setChangedElsewhere] = useState(false)

  const editing = name.trim() !== base.name || open !== base.open || close !== base.close
  const latest = values(settings)
  if (!sameValues(latest, base)) {
    // New values were saved. Untouched form: show them. Half-edited form: keep the edit and say so.
    setBase(latest)
    // (If the form already shows the new values, this device saved them: nothing to warn about.)
    if (editing && !sameValues({ name: name.trim(), open, close }, latest)) setChangedElsewhere(true)
    else {
      setName(latest.name)
      setOpen(latest.open)
      setClose(latest.close)
    }
  }

  function loadLatest() {
    setName(latest.name)
    setOpen(latest.open)
    setClose(latest.close)
    setChangedElsewhere(false)
  }

  const dirty = name.trim() !== latest.name || open !== latest.open || close !== latest.close

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2 || name.trim().length > 40) return setError('Salon name is 2–40 characters.')
    if (!open || !close || open >= close) return setError('Opening time must be before closing time.')
    setState('loading')
    try {
      await ownerUpdateSettings(pin, { salonName: name.trim(), openTime: open, closeTime: close })
      await refreshQueue()
      setChangedElsewhere(false)
      setState('done')
      setTimeout(() => setState('idle'), 1600)
    } catch (err) {
      setError(ownerError(err))
      setState('idle')
    }
  }

  return (
    <Section title="Salon" id="salon-title">
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <TextField id="salon-name" label="Salon name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="salon-open" label="Opens" type="time" className="num h-14 w-full min-w-0 bg-transparent text-body font-semibold text-text outline-none" value={open} onChange={(e) => setOpen(e.target.value)} />
          <TextField id="salon-close" label="Closes" type="time" className="num h-14 w-full min-w-0 bg-transparent text-body font-semibold text-text outline-none" value={close} onChange={(e) => setClose(e.target.value)} />
        </div>
        <p className="text-caption text-muted">Online joining closes 30 min before closing.</p>
        {changedElsewhere && (
          <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-warning-tint px-4 py-2.5 text-small font-semibold text-warning">
            Changed on another device.
            <button type="button" onClick={loadLatest} className="min-h-11 underline underline-offset-2">
              Use latest
            </button>
          </p>
        )}
        <Notice text={error} tone="error" />
        <PillButton type="submit" state={state} disabled={!dirty && state === 'idle'}>
          {state === 'done' ? 'Saved' : 'Save'}
        </PillButton>
      </form>
    </Section>
  )
}
