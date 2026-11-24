import { useState, type FormEvent } from 'react'
import { ownerUpdateSettings } from '../../lib/api'
import { refreshQueue } from '../../lib/liveQueue'
import type { Settings } from '../../lib/types'
import { TextField } from '../Fields'
import PillButton from '../PillButton'
import { Notice, Section } from './ui'
import { ownerError } from './ownerError'

const hhmm = (t: string) => t.slice(0, 5)

/** Salon name and opening hours → owner_update_settings. */
export default function SalonSettings({ pin, settings }: { pin: string; settings: Settings }) {
  const [name, setName] = useState(settings.salon_name)
  const [open, setOpen] = useState(hhmm(settings.open_time))
  const [close, setClose] = useState(hhmm(settings.close_time))
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const dirty = name.trim() !== settings.salon_name || open !== hhmm(settings.open_time) || close !== hhmm(settings.close_time)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2 || name.trim().length > 40) return setError('Salon name is 2–40 characters.')
    if (!open || !close || open >= close) return setError('Opening time must be before closing time.')
    setState('loading')
    try {
      await ownerUpdateSettings(pin, { salonName: name.trim(), openTime: open, closeTime: close })
      await refreshQueue()
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
        <Notice text={error} tone="error" />
        <PillButton type="submit" state={state} disabled={!dirty && state === 'idle'}>
          {state === 'done' ? 'Saved' : 'Save'}
        </PillButton>
      </form>
    </Section>
  )
}
