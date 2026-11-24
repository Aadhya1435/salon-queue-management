import { Coffee, Lock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { BarberAvatar } from '../components/BarberAvatar'
import BigActionButton from '../components/barber/BigActionButton'
import { StatusChip } from '../components/barber/StatusChip'
import LiveDot from '../components/LiveDot'
import { Rolling } from '../components/Numbers'
import PinGate from '../components/PinGate'
import { callNext, finishService, setBreak, staffQueue, startService } from '../lib/api'
import { burst } from '../lib/confetti'
import { friendlyError } from '../lib/errors'
import { formatToken } from '../lib/format'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { barberNow, byQueueOrder } from '../lib/queue/estimate'
import { handleStaffError, lockStaff, useStaffSession } from '../lib/staff'
import type { Barber as BarberRow, StaffQueueEntry } from '../lib/types'
import { useNow } from '../lib/useNow'
import { duration, ease, spring, transition } from '../styles/motion'
import BackButton from '../components/BackButton'

/** Screen 5: Barber View (docs/02-screens.md). The :name param is the barber's slug. */
export default function Barber() {
  return (
    <PinGate need="staff">
      <BarberScreen />
    </PinGate>
  )
}

function BarberScreen() {
  const { name = '' } = useParams()
  const live = useLiveQueue()
  // The address is the stylist's slug (e.g. neha), or her id when the name has no Latin letters.
  const barber = live.barbers.find((b) => (b.slug && b.slug === name) || b.id === name)

  useEffect(() => {
    document.title = barber ? `${barber.name} · Roselle` : 'Stylist · Roselle'
  }, [barber])

  if (live.status === 'loading') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 px-5 pt-5">
        <div className="h-12 animate-pulse rounded-full bg-surface-2" />
        <div className="h-72 animate-pulse rounded-card bg-surface-2" />
        <div className="h-24 animate-pulse rounded-card bg-surface-2" />
      </main>
    )
  }
  if (!barber) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="text-title font-bold">{live.status === 'error' ? "Can't reach the salon right now." : 'This stylist isn’t on duty today.'}</h1>
        <p className="text-small text-muted">Pick your name from the list of stylists working today.</p>
        <Link to="/stylist" className="flex min-h-11 items-center rounded-full bg-primary px-6 text-body font-bold text-on-primary">
          Pick a stylist
        </Link>
      </main>
    )
  }
  return <BarberView barber={barber} />
}

type Action = 'call' | 'start' | 'done' | 'break' | 'back'

function BarberView({ barber }: { barber: BarberRow }) {
  const session = useStaffSession()
  const pin = session?.pin ?? ''
  const live = useLiveQueue()
  const now = useNow(1000)
  const [rows, setRows] = useState<StaffQueueEntry[] | null>(null)
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!pin) return
    try {
      setRows(await staffQueue(pin))
    } catch (e) {
      handleStaffError(e)
      setError(friendlyError(e))
    }
  }, [pin])

  useEffect(() => {
    const id = setTimeout(load, 0)
    return () => clearTimeout(id)
  }, [load, live.version])

  async function run(action: Action, fn: () => Promise<unknown>, from: HTMLElement | null = null) {
    setBusy(action)
    setError(null)
    try {
      await fn()
      if (action === 'done') confetti(from)
    } catch (e) {
      handleStaffError(e)
      setError(friendlyError(e))
    } finally {
      await Promise.all([load(), refreshQueue()])
      setBusy(null)
    }
  }

  /** Done: a small confetti burst from the giant button (Motion moment 17). */
  function confetti(from: HTMLElement | null) {
    const host = from?.closest('main')
    if (!from || !host) return
    const h = host.getBoundingClientRect()
    const b = from.getBoundingClientRect()
    burst(host, b.left - h.left + b.width / 2, b.top - h.top + b.height / 2, 28, 0.8)
  }

  const mine = rows ?? []
  const current = mine.find((e) => e.assigned_barber === barber.id && (e.status === 'called' || e.status === 'in_chair')) ?? null
  // Same rule as call_next (docs/03-flows-rules.md §3): earliest-joined Waiting who chose this barber or Any.
  const waitingForMe = mine.filter((e) => e.status === 'waiting' && (e.barber_pref === barber.id || e.barber_pref === null)).sort(byQueueOrder)
  const next = waitingForMe[0] ?? null
  const choseMe = waitingForMe.filter((e) => e.barber_pref === barber.id).length
  const anyBarber = waitingForMe.length - choseMe
  const doneToday = mine.filter((e) => e.status === 'done' && e.assigned_barber === barber.id).length
  const state = barberNow(barber, live.entries, now)
  const loaded = rows !== null

  let chipLabel: string | undefined
  if (current?.status === 'called') chipLabel = 'Called'
  else if (current?.status === 'in_chair') chipLabel = 'In chair'

  // The giant button for each state.
  let cta: { label: string; action: Action; onClick: (el: HTMLButtonElement) => void; disabled?: boolean } | null = null
  if (current?.status === 'called') cta = { label: 'Start', action: 'start', onClick: () => run('start', () => startService(pin, current.id)) }
  else if (current?.status === 'in_chair') cta = { label: 'Done', action: 'done', onClick: (el) => run('done', () => finishService(pin, current.id), el) }
  else if (loaded)
    cta = {
      label: next ? 'Call next' : 'No one waiting',
      action: 'call',
      disabled: !next,
      onClick: () =>
        run('call', async () => {
          const called = await callNext(pin, barber.id)
          if (!called) setError(`No one waiting for ${barber.name}.`)
        }),
    }

  const onBreak = barber.on_break

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col overflow-x-clip">
      <motion.div
        className="flex flex-1 flex-col"
        animate={onBreak ? { opacity: 0.35, filter: 'blur(3px)' } : { opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: duration.slow, ease: ease.out }}
        aria-hidden={onBreak || undefined}
        inert={onBreak || undefined}
      >
        {/* ── Top bar ── */}
        <header className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
          <BackButton to="/stylist" ariaLabel="Back to stylists" />
          <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={46} progress={state.kind === 'busy' ? state.progress : null} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-title font-extrabold tracking-tight">{barber.name}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusChip state={state} label={chipLabel} />
              <LiveDot live={live.live} />
            </div>
          </div>
          <button
            type="button"
            onClick={lockStaff}
            aria-label="Lock"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-text shadow-card"
          >
            <Lock size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-full bg-surface py-1.5 pr-1.5 pl-5 shadow-card">
          <span className="min-w-0 text-small">
            <span className="font-bold">{onBreak ? 'On break' : 'Available'}</span>
            {current && <span className="block truncate text-caption text-muted">Finish with {formatToken(current.token)} first</span>}
          </span>
          <BreakSwitch
            on={onBreak}
            disabled={Boolean(current) || busy !== null}
            onChange={(v) => run(v ? 'break' : 'back', () => setBreak(pin, barber.id, v))}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 overflow-hidden"
            >
              <span className="mt-3 block rounded-tile bg-warning-tint px-4 py-3 text-small font-semibold text-warning">{error}</span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Hero card ── */}
        <section aria-live="polite" className="relative mx-5 mt-4 overflow-hidden rounded-sheet bg-linear-to-br from-hero to-hero-2 p-6 text-white shadow-pop">
          {!loaded ? (
            <div className="h-48 animate-pulse rounded-card bg-white/10" />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current ? `${current.id}-${current.status}` : next ? 'free' : 'empty'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={transition.fade}
              >
                {current ? <CurrentCustomer entry={current} now={now} /> : <FreeHero hasNext={Boolean(next)} name={barber.name} />}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* ── Below the hero ── */}
        <section className="mx-5 mt-4 flex flex-col gap-3">
          <div className="rounded-card bg-surface p-5 shadow-card">
            <h2 className="text-caption font-bold tracking-wide text-muted uppercase">Next for you</h2>
            {!loaded ? (
              <div className="mt-2 h-10 animate-pulse rounded-tile bg-surface-2" />
            ) : next ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="num rounded-full bg-accent px-3 py-1 text-body font-extrabold text-on-accent">{formatToken(next.token)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-bold">
                    {next.full_name ?? next.first_name}
                    {next.barber_pref === null && <span className="font-medium text-muted"> · any stylist</span>}
                  </p>
                  <p className="num truncate text-small text-muted">
                    {next.services.map((s) => s.name).join(', ')} · waiting {minutesSince(next.joined_at, now)} min
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-small text-muted">No one waiting for you.</p>
            )}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="rounded-card bg-surface p-5 shadow-card">
              <p className="text-body font-bold">
                <span className="num">{waitingForMe.length}</span> waiting for you
              </p>
              <p className="num mt-0.5 text-small text-muted">
                {choseMe} chose you · {anyBarber} any stylist
              </p>
            </div>
            <div className="rounded-card bg-surface p-5 text-center shadow-card">
              <p className="text-caption font-bold text-muted uppercase">Today</p>
              <p className="text-body font-bold">
                <Rolling value={doneToday} /> done
              </p>
            </div>
          </div>
        </section>

        {/* ── Giant button, in the lower third ── */}
        <div className="sticky bottom-0 mt-auto bg-linear-to-t from-bg via-bg to-transparent px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {cta ? (
            <BigActionButton label={cta.label} onClick={cta.onClick} disabled={cta.disabled} busy={busy === cta.action} />
          ) : (
            <div className="h-20 animate-pulse rounded-full bg-surface-2" />
          )}
        </div>
      </motion.div>

      {/* ── On break (Motion moment 18) ── */}
      <AnimatePresence>
        {onBreak && (
          <motion.div
            className="fixed inset-0 z-20 flex items-end justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base }}
          >
            <motion.div
              role="dialog"
              aria-label="On break"
              className="w-full max-w-xl rounded-sheet bg-surface p-6 text-center shadow-pop"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: duration.slow, ease: ease.out }}
            >
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-2 text-break">
                <Coffee size={26} aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-heading font-extrabold tracking-tight">On break</h2>
              <p className="mt-1 text-small text-muted">
                Customers who chose you see “{barber.name} is on break”. “Any stylist” customers go to the others.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-small font-semibold text-danger">
                  {error}
                </p>
              )}
              <div className="mt-5">
                <BigActionButton label="I'm back" busy={busy === 'back'} onClick={() => run('back', () => setBreak(pin, barber.id, false))} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function FreeHero({ hasNext, name }: { hasNext: boolean; name: string }) {
  return (
    <div className="flex min-h-48 flex-col justify-center">
      <p className="text-caption font-bold tracking-wide text-white/70 uppercase">{hasNext ? 'Ready' : 'All clear'}</p>
      <p className="mt-2 text-big font-extrabold tracking-tight">{hasNext ? "You're free" : 'No one waiting for you'}</p>
      <p className="mt-2 text-small text-white/80">
        {hasNext ? 'Tap Call next when your chair is ready.' : `New customers who choose ${name} or Any stylist show up here.`}
      </p>
    </div>
  )
}

function CurrentCustomer({ entry, now }: { entry: StaffQueueEntry; now: number }) {
  const inChair = entry.status === 'in_chair'
  const since = inChair ? entry.started_at : entry.called_at
  const seconds = since ? Math.max(0, Math.floor((now - Date.parse(since)) / 1000)) : 0
  const progress = Math.min(1, seconds / 60 / Math.max(1, entry.total_minutes))

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <motion.p
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.pop}
          className="num text-token font-extrabold tracking-tight"
        >
          {formatToken(entry.token)}
        </motion.p>
        <span className="mt-2 rounded-full bg-white/15 px-3 py-1 text-caption font-bold">{inChair ? 'In chair' : 'Called'}</span>
      </div>
      <p className="mt-1 truncate text-title font-bold">{entry.full_name ?? entry.first_name}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {entry.services.map((s) => (
          <li key={s.id} className="rounded-full bg-white/15 px-3 py-1 text-caption font-semibold">
            {s.name}
          </li>
        ))}
      </ul>

      {inChair ? (
        <div className="mt-5">
          <div className="flex items-baseline gap-3">
            <Clock seconds={seconds} className="text-[56px] leading-none font-extrabold tracking-tight" />
            <span className="num text-small text-white/80">of {entry.total_minutes} min</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <motion.div
              className={`h-full rounded-full ${progress >= 1 ? 'bg-blob-orchid' : 'bg-white'}`}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: ease.out }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-5 text-small text-white/85">
          Called <Clock seconds={seconds} className="font-bold" /> ago
        </p>
      )}
    </div>
  )
}

/** m:ss / mm:ss where each digit rolls (Motion moment 17). */
function Clock({ seconds, className = '' }: { seconds: number; className?: string }) {
  const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  return (
    <span className={`num inline-flex ${className}`} aria-label={text}>
      {text.split('').map((ch, i) => (
        <Rolling key={text.length - i} value={ch} />
      ))}
    </span>
  )
}

function BreakSwitch({ on, disabled, onChange }: { on: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="On break"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 py-1 pr-1 pl-4 text-caption font-bold text-text disabled:cursor-not-allowed disabled:opacity-50"
    >
      Break
      <span className={`relative h-8 w-14 rounded-full transition-colors ${on ? 'bg-break' : 'bg-primary'}`}>
        <motion.span
          className="absolute top-1 size-6 rounded-full bg-white shadow-card"
          initial={false}
          animate={{ left: on ? 28 : 4 }}
          transition={spring.soft}
        />
      </span>
    </button>
  )
}

function minutesSince(iso: string, now: number) {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000))
}

