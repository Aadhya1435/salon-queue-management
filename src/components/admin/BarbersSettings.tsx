import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ownerSaveBarber, ownerSetDuty } from '../../lib/api'
import { errorCode } from '../../lib/errors'
import { refreshQueue } from '../../lib/liveQueue'
import { supabase } from '../../lib/supabase'
import type { Barber, BarberShape } from '../../lib/types'
import { BarberAvatar } from '../BarberAvatar'
import { TextField } from '../Fields'
import PillButton from '../PillButton'
import Sheet from '../Sheet'
import { ConfirmButtons, Notice, Section, SmallButton, Switch } from './ui'
import { ownerError } from './ownerError'

// Barber signature colours are stored in the database as hex (they match
// --color-barber-1…4 in src/styles/theme.css). Swatches render with the CSS variables.
const COLORS = [
  { hex: '#A64DB5', token: 'var(--color-barber-1)', name: 'Orchid' },
  { hex: '#2F8A6B', token: 'var(--color-barber-2)', name: 'Green' },
  { hex: '#4A72BC', token: 'var(--color-barber-3)', name: 'Blue' },
  { hex: '#8C5E92', token: 'var(--color-barber-4)', name: 'Plum' },
]
const SHAPES: BarberShape[] = ['star', 'clover', 'circle', 'pill']

const fetchBarbers = () => supabase.from('barbers').select('*').order('sort')

/** Every barber (on and off duty), refetched when the live data changes. */
function useAllBarbers(version: number) {
  const [barbers, setBarbers] = useState<Barber[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const apply = useCallback(({ data, error: e }: Awaited<ReturnType<typeof fetchBarbers>>) => {
    if (e) setError(ownerError(e))
    else {
      setError(null)
      setBarbers(data as Barber[])
    }
  }, [])
  const reload = useCallback(async () => apply(await fetchBarbers()), [apply])
  useEffect(() => {
    let cancelled = false
    fetchBarbers().then((r) => !cancelled && apply(r))
    return () => {
      cancelled = true
    }
  }, [apply, version])
  return { barbers, error, reload }
}

type Editing = { id: string | null; name: string; color: string; shape: BarberShape; sort: number }

export default function BarbersSettings({ pin, version }: { pin: string; version: number }) {
  const { barbers, error: loadError, reload } = useAllBarbers(version)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [move, setMove] = useState<{ barber: Barber; count: number } | null>(null)
  const [moving, setMoving] = useState(false)
  const [editing, setEditing] = useState<Editing | null>(null)

  async function setDuty(b: Barber, onDuty: boolean, moveToAny = false) {
    setPending((p) => ({ ...p, [b.id]: onDuty }))
    setError(null)
    try {
      await ownerSetDuty(pin, b.id, onDuty, moveToAny)
      await Promise.all([reload(), refreshQueue()])
      return true
    } catch (e) {
      if (errorCode(e) === 'barber_has_customers') {
        const detail = (e as { details?: string; detail?: string }).details ?? (e as { detail?: string }).detail ?? ''
        setMove({ barber: b, count: Number.parseInt(detail, 10) || 0 })
      } else setError(ownerError(e))
      return false
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[b.id]
        return next
      })
    }
  }

  async function confirmMove() {
    if (!move) return
    setMoving(true)
    const ok = await setDuty(move.barber, false, true)
    setMoving(false)
    if (ok) setMove(null)
  }

  const nextSort = Math.max(0, ...(barbers ?? []).map((b) => b.sort)) + 1

  return (
    <Section
      title="Stylists"
      id="barbers-title"
      action={
        <SmallButton onClick={() => setEditing({ id: null, name: '', color: COLORS[0].hex, shape: 'star', sort: nextSort })} disabled={!barbers}>
          <Plus size={16} aria-hidden="true" /> Add stylist
        </SmallButton>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {!barbers && [0, 1, 2].map((i) => <li key={i} aria-hidden="true" className="my-1.5 h-12 animate-pulse rounded-tile bg-surface-2" />)}
        {barbers?.map((b) => {
          const onDuty = pending[b.id] ?? b.on_duty
          return (
            <li key={b.id} className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                onClick={() => setEditing({ id: b.id, name: b.name, color: b.color, shape: b.shape, sort: b.sort })}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-tile text-left"
                aria-label={`Edit ${b.name}`}
              >
                <BarberAvatar name={b.name} color={b.color} shape={b.shape} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-body font-bold">{b.name}</span>
                  <span className="block text-caption text-muted">{onDuty ? (b.on_break ? 'On duty · on break' : 'On duty today') : 'Off today'}</span>
                </span>
              </button>
              <Switch checked={onDuty} disabled={b.id in pending} onChange={(next) => void setDuty(b, next)} label={`${b.name} on duty today`} />
            </li>
          )
        })}
      </ul>
      <Notice text={error ?? loadError} tone="error" />

      <Sheet open={move !== null} onClose={() => setMove(null)} title="Customers are waiting">
        {move && (
          <>
            <p className="text-body text-text">
              {move.barber.name} still has <span className="num font-bold">{move.count || 'some'}</span> {move.count === 1 ? 'customer' : 'customers'} waiting.
              Move them to ‘Any stylist’?
            </p>
            <p className="mt-2 text-small text-muted">They keep their places in the queue.</p>
            <ConfirmButtons confirm="Move & turn off" onConfirm={() => void confirmMove()} onCancel={() => setMove(null)} busy={moving} />
          </>
        )}
      </Sheet>

      <BarberEditor
        pin={pin}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null)
          await Promise.all([reload(), refreshQueue()])
        }}
      />
    </Section>
  )
}

function BarberEditor({ pin, editing, onClose, onSaved }: { pin: string; editing: Editing | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<Editing | null>(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seen, setSeen] = useState(editing)

  // Reset the form whenever a different barber is opened.
  if (editing !== seen) {
    setSeen(editing)
    setDraft(editing)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    const name = draft.name.trim()
    if (name.length < 2 || name.length > 30) return setError('Enter a name (2–30 letters).')
    setBusy(true)
    setError(null)
    try {
      await ownerSaveBarber(pin, { ...draft, name })
      await onSaved()
    } catch (err) {
      setError(ownerError(err))
    } finally {
      setBusy(false)
    }
  }

  const current = draft ?? editing
  return (
    <Sheet open={editing !== null} onClose={onClose} title={editing?.id ? 'Edit stylist' : 'Add stylist'}>
      {current && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex items-center gap-4">
            <BarberAvatar name={current.name || '?'} color={current.color} shape={current.shape} size={64} />
            <div className="min-w-0 flex-1">
              <TextField id="barber-name" label="Name" value={current.name} maxLength={30} autoFocus onChange={(e) => setDraft({ ...current, name: e.target.value })} />
            </div>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-caption font-semibold text-muted">Colour</legend>
            <div className="flex gap-3">
              {COLORS.map((c) => {
                const selected = current.color.toLowerCase() === c.hex.toLowerCase()
                return (
                  <button
                    key={c.hex}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={selected}
                    onClick={() => setDraft({ ...current, color: c.hex })}
                    className={`grid size-11 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-surface transition ${selected ? 'ring-primary' : 'ring-transparent'}`}
                    style={{ background: c.token }}
                  />
                )
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-caption font-semibold text-muted">Shape</legend>
            <div className="flex gap-2">
              {SHAPES.map((s) => {
                const selected = current.shape === s
                return (
                  <button
                    key={s}
                    type="button"
                    aria-label={s}
                    aria-pressed={selected}
                    onClick={() => setDraft({ ...current, shape: s })}
                    className={`grid size-14 place-items-center rounded-tile transition ${selected ? 'bg-accent-tint ring-2 ring-primary' : 'bg-surface-2'}`}
                  >
                    <BarberAvatar name={current.name || '?'} color={current.color} shape={s} size={34} />
                  </button>
                )
              })}
            </div>
          </fieldset>
          <Notice text={error} tone="error" />
          <PillButton type="submit" state={busy ? 'loading' : 'idle'}>
            {editing?.id ? 'Save stylist' : 'Add stylist'}
          </PillButton>
        </form>
      )}
    </Sheet>
  )
}
