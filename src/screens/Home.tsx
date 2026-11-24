import { motion } from 'motion/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BarberAvatar } from '../components/BarberAvatar'
import BlobCluster from '../components/BlobCluster'
import { PhoneField } from '../components/Fields'
import LiveDot from '../components/LiveDot'
import { CountUp } from '../components/Numbers'
import PillButton from '../components/PillButton'
import Sheet from '../components/Sheet'
import { findMySpot } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { formatToken, ordinal } from '../lib/format'
import { phoneError } from '../lib/joinForm'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { loadMySpot, saveMySpot } from '../lib/mySpot'
import { waitPhrase } from '../lib/queue/display'
import { barberNow, forecastQueue, newCustomerWait, type BarberNow } from '../lib/queue/estimate'
import { onlineJoinWindow, openStatus } from '../lib/queue/joinWindow'
import { salonMinutes } from '../lib/time'
import { useNow } from '../lib/useNow'
import { rise, stagger, transition } from '../styles/motion'

const appear = (i: number, base = 0) => ({ ...rise, transition: { ...transition.card, delay: base + i * stagger.hero } })

/** Screen 1: Home (docs/02-screens.md). */
export default function Home() {
  const live = useLiveQueue()
  const now = useNow()
  const [findOpen, setFindOpen] = useState(false)
  const saved = useMemo(() => loadMySpot(), [])

  const { settings, barbers, entries } = live
  const forecast = useMemo(() => forecastQueue(barbers, entries, now), [barbers, entries, now])
  const waitingCount = entries.filter((e) => e.status === 'waiting').length
  const newWait = newCustomerWait(forecast, null)
  const nowMinutes = salonMinutes(new Date(now))
  const status = settings ? openStatus(settings, nowMinutes) : null
  const joinWindow = settings ? onlineJoinWindow(settings, barbers, nowMinutes) : null

  const mySpot = saved ? entries.find((e) => e.id === saved.id) : undefined
  const myEstimate = mySpot ? forecast.byEntry.get(mySpot.id) : undefined

  useEffect(() => {
    document.title = settings ? `${settings.salon_name} · Waitly` : 'Waitly'
  }, [settings])

  const salonName = settings?.salon_name ?? 'Waitly'
  const ready = live.status === 'ready'

  let subLine: React.ReactNode = 'Checking the queue…'
  if (live.status === 'error') subLine = "Can't reach the salon right now."
  else if (ready && newWait === null) subLine = 'No barbers available right now.'
  else if (ready && newWait !== null && waitingCount === 0 && newWait < 1) subLine = 'No one waiting — walk right in!'
  else if (ready && newWait !== null) subLine = <>{capitalise(waitPhrase(newWait))} if you join now</>

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:p-8">
      {/* ── Hero panel ── */}
      <header className="relative overflow-hidden rounded-b-sheet bg-linear-to-br from-hero to-hero-2 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-7 text-white lg:rounded-sheet lg:p-8">
        <BlobCluster className="pointer-events-none absolute top-12 -right-3 w-[42%] max-w-40" />
        <div className="relative flex flex-col gap-7">
          <motion.div {...appear(0)} className="flex items-center gap-3 pr-28">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-title font-extrabold text-primary">
              {salonName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-body font-bold">{salonName}</p>
              <p className="flex items-center gap-1.5 text-caption text-white/80">
                <span aria-hidden="true" className={`size-2 rounded-full ${status?.open ? 'bg-blob-mint' : 'bg-break'}`} />
                {status?.label ?? '…'}
              </p>
            </div>
          </motion.div>

          <motion.div {...appear(1)}>
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              {ready ? <CountUp value={waitingCount} className="text-big font-extrabold tracking-tight" /> : <span className="text-big font-extrabold text-white/40">–</span>}
              <span className="text-title font-semibold">waiting</span>
              <LiveDot live={live.live} onDark />
            </p>
            <p className="mt-2 text-small text-white/85">{subLine}</p>
          </motion.div>

          <motion.div {...appear(2)} className="flex flex-col gap-2">
            {mySpot ? (
              <PillButton variant="white" to={`/status/${mySpot.id}`}>
                <span className="num">{formatToken(mySpot.token)}</span> ·{' '}
                {mySpot.status === 'called'
                  ? "It's your turn!"
                  : mySpot.status === 'in_chair'
                    ? 'In the chair'
                    : myEstimate
                      ? `${ordinal(myEstimate.place)}${myEstimate.wait !== null ? ` · ${waitPhrase(myEstimate.wait, myEstimate.place)}` : ''}`
                      : 'View my spot'}
              </PillButton>
            ) : live.status === 'error' ? (
              <PillButton variant="white" onClick={() => refreshQueue()}>
                Try again
              </PillButton>
            ) : joinWindow && !joinWindow.open ? (
              <>
                <PillButton variant="white" disabled>
                  Join the queue
                </PillButton>
                <p className="px-2 text-small text-white/85">{joinWindow.message}</p>
              </>
            ) : (
              <PillButton variant="white" to="/join">
                Join the queue
              </PillButton>
            )}
          </motion.div>
        </div>
      </header>

      {/* ── Barbers today ── */}
      <div className="flex flex-1 flex-col lg:min-h-full">
        <section aria-labelledby="barbers-title" className="px-5 pt-7 lg:px-0 lg:pt-2">
          <h2 id="barbers-title" className="flex items-center gap-2 text-body font-bold">
            Barbers today
            {ready && (
              <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-caption font-bold text-on-accent">{barbers.length}</span>
            )}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {!ready &&
              [0, 1, 2].map((i) => <li key={i} aria-hidden="true" className="h-16 animate-pulse rounded-card bg-surface-2" />)}
            {ready && barbers.length === 0 && <li className="rounded-card bg-surface p-5 text-small text-muted shadow-card">No barbers on duty today.</li>}
            {ready &&
              barbers.map((b, i) => {
                const state = barberNow(b, entries, now)
                return (
                  <motion.li key={b.id} {...appear(i, 0.3)} className="flex items-center gap-3 rounded-card bg-surface py-2.5 pr-3 pl-3 shadow-card">
                    <BarberAvatar name={b.name} color={b.color} shape={b.shape} size={42} progress={state.kind === 'busy' ? state.progress : null} />
                    <span className="min-w-0 flex-1 truncate text-body font-bold">{b.name}</span>
                    <StatusChip state={state} />
                  </motion.li>
                )
              })}
          </ul>
          <button
            type="button"
            onClick={() => setFindOpen(true)}
            className="mx-auto mt-5 flex min-h-11 items-center gap-1 text-small text-muted"
          >
            Already in the queue? <span className="font-semibold text-text underline underline-offset-2">Find my spot</span>
          </button>
        </section>

        <footer className="mt-auto flex items-center justify-between px-5 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-caption text-muted lg:px-0">
          <Link to="/staff" className="flex min-h-11 items-center font-semibold hover:text-text">
            Staff
          </Link>
          <span className="flex items-center gap-1.5 font-semibold">
            <img src="/favicon.svg" alt="" className="size-4 rounded" /> Waitly
          </span>
        </footer>
      </div>

      <FindMySpot open={findOpen} onClose={() => setFindOpen(false)} />
    </main>
  )
}

function StatusChip({ state }: { state: BarberNow }) {
  if (state.kind === 'free') return <span className="rounded-full bg-success-tint px-3 py-1 text-caption font-semibold text-success">Free</span>
  if (state.kind === 'break') return <span className="rounded-full bg-surface-2 px-3 py-1 text-caption font-semibold text-muted">On break</span>
  return (
    <span className="num rounded-full bg-surface-2 px-3 py-1 text-caption font-semibold text-text">
      Busy · {state.minutesLeft} min
    </span>
  )
}

function FindMySpot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [digits, setDigits] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = phoneError(digits)
    if (problem) return setMessage(problem)
    setBusy(true)
    setMessage(null)
    try {
      const spot = await findMySpot(digits)
      if (!spot) return setMessage('No active spot for this number today.')
      saveMySpot(spot.id, spot.token)
      navigate(`/status/${spot.id}`)
    } catch (error) {
      setMessage(friendlyError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Find my spot">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <PhoneField id="find-phone" label="The phone number you joined with" digits={digits} onDigits={setDigits} error={message} autoFocus />
        <PillButton type="submit" state={busy ? 'loading' : 'idle'}>
          Find my spot
        </PillButton>
      </form>
    </Sheet>
  )
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
