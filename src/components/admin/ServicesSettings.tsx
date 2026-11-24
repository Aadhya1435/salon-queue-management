import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ownerSaveService } from '../../lib/api'
import { formatRupees } from '../../lib/format'
import { refreshQueue } from '../../lib/liveQueue'
import { supabase } from '../../lib/supabase'
import type { Service } from '../../lib/types'
import { TextField } from '../Fields'
import PillButton from '../PillButton'
import Sheet from '../Sheet'
import { Notice, Section, SmallButton, Switch } from './ui'
import { ownerError } from './ownerError'

const fetchServices = () => supabase.from('services').select('*').order('sort')

type Draft = { id: string | null; name: string; minutes: string; price: string; active: boolean; sort: number }

export default function ServicesSettings({ pin, version }: { pin: string; version: number }) {
  const [services, setServices] = useState<Service[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)

  const apply = useCallback(({ data, error: e }: Awaited<ReturnType<typeof fetchServices>>) => {
    if (e) setError(ownerError(e))
    else setServices(data as Service[])
  }, [])
  const reload = useCallback(async () => apply(await fetchServices()), [apply])

  useEffect(() => {
    let cancelled = false
    fetchServices().then((r) => !cancelled && apply(r))
    return () => {
      cancelled = true
    }
  }, [apply, version])

  async function run(key: string, work: () => Promise<unknown>) {
    setBusy(key)
    setError(null)
    try {
      await work()
      await Promise.all([reload(), refreshQueue()])
    } catch (e) {
      setError(ownerError(e))
    } finally {
      setBusy(null)
    }
  }

  const save = (s: Service, patch: Partial<Service>) => ownerSaveService(pin, { ...s, ...patch })

  function moveBy(index: number, dir: -1 | 1) {
    if (!services) return
    const a = services[index]
    const b = services[index + dir]
    if (!b) return
    // Swap sort values (if they're equal, nudge so the order still changes).
    const aSort = a.sort === b.sort ? b.sort + dir : b.sort
    const bSort = a.sort
    // Show the new order straight away.
    const next = [...services]
    next[index] = b
    next[index + dir] = a
    setServices(next)
    void run(`move-${a.id}`, () => Promise.all([save(a, { sort: aSort }), save(b, { sort: bSort })]))
  }

  const nextSort = Math.max(0, ...(services ?? []).map((s) => s.sort)) + 1

  return (
    <Section
      title="Services"
      id="services-title"
      action={
        <SmallButton onClick={() => setEditing({ id: null, name: '', minutes: '30', price: '', active: true, sort: nextSort })} disabled={!services}>
          <Plus size={16} aria-hidden="true" /> Add service
        </SmallButton>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {!services && [0, 1, 2, 3].map((i) => <li key={i} aria-hidden="true" className="my-1.5 h-12 animate-pulse rounded-tile bg-surface-2" />)}
        {services?.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setEditing({ id: s.id, name: s.name, minutes: String(s.minutes), price: String(s.price), active: s.active, sort: s.sort })}
              className="min-h-11 min-w-0 flex-1 rounded-tile text-left"
              aria-label={`Edit ${s.name}`}
            >
              <span className={`block truncate text-body font-bold ${s.active ? '' : 'text-muted line-through decoration-1'}`}>{s.name}</span>
              <span className="num block text-caption text-muted">
                {s.minutes} min · {formatRupees(s.price)}
              </span>
            </button>
            <div className="flex shrink-0">
              <button
                type="button"
                aria-label={`Move ${s.name} up`}
                disabled={i === 0 || busy !== null}
                onClick={() => moveBy(i, -1)}
                className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-30"
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                aria-label={`Move ${s.name} down`}
                disabled={i === services.length - 1 || busy !== null}
                onClick={() => moveBy(i, 1)}
                className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 disabled:opacity-30"
              >
                <ArrowDown size={18} />
              </button>
            </div>
            <Switch
              checked={busy === `active-${s.id}` ? !s.active : s.active}
              disabled={busy !== null}
              onChange={(next) => void run(`active-${s.id}`, () => save(s, { active: next }))}
              label={`${s.name} available`}
            />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-caption text-muted">Turning a service off hides it from Join straight away.</p>
      <Notice text={error} tone="error" />

      <ServiceEditor
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

function ServiceEditor({ pin, editing, onClose, onSaved }: { pin: string; editing: Draft | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(editing)
  const [seen, setSeen] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (editing !== seen) {
    setSeen(editing)
    setDraft(editing)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    const name = draft.name.trim()
    const minutes = Number(draft.minutes)
    const price = Number(draft.price)
    if (name.length < 2 || name.length > 40) return setError('Enter a name (2–40 characters).')
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 240) return setError('Minutes must be a whole number from 5 to 240.')
    if (draft.price === '' || !Number.isInteger(price) || price < 0) return setError('Enter the price in whole rupees.')
    setBusy(true)
    setError(null)
    try {
      await ownerSaveService(pin, { id: draft.id, name, minutes, price, active: draft.active, sort: draft.sort })
      await onSaved()
    } catch (err) {
      setError(ownerError(err))
    } finally {
      setBusy(false)
    }
  }

  const current = draft ?? editing
  return (
    <Sheet open={editing !== null} onClose={onClose} title={editing?.id ? 'Edit service' : 'Add service'}>
      {current && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <TextField id="service-name" label="Name" value={current.name} maxLength={40} autoFocus onChange={(e) => setDraft({ ...current, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="service-minutes"
              label="Minutes"
              inputMode="numeric"
              className="num h-14 w-full min-w-0 bg-transparent text-body font-semibold text-text outline-none"
              value={current.minutes}
              onChange={(e) => setDraft({ ...current, minutes: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            />
            <TextField
              id="service-price"
              label="Price (₹)"
              inputMode="numeric"
              className="num h-14 w-full min-w-0 bg-transparent text-body font-semibold text-text outline-none"
              value={current.price}
              onChange={(e) => setDraft({ ...current, price: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            />
          </div>
          <Notice text={error} tone="error" />
          <PillButton type="submit" state={busy ? 'loading' : 'idle'}>
            {editing?.id ? 'Save service' : 'Add service'}
          </PillButton>
        </form>
      )}
    </Sheet>
  )
}
