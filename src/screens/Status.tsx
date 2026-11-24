import { ArrowLeft, CalendarX2, CircleSlash, RotateCcw, UserX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useParams } from 'react-router'
import { AnyAvatar, BarberAvatar } from '../components/BarberAvatar'
import LiveDot from '../components/LiveDot'
import { Rolling } from '../components/Numbers'
import PillButton from '../components/PillButton'
import Sheet from '../components/Sheet'
import CalledTakeover from '../components/status/CalledTakeover'
import JourneyTracker from '../components/status/JourneyTracker'
import RateVisit from '../components/status/RateVisit'
import StatusBanner from '../components/status/StatusBanner'
import WaitRing from '../components/status/WaitRing'
import { cancelMySpot } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { formatClock, formatToken, ordinal } from '../lib/format'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { clearMySpot, currentSpot, saveMySpot } from '../lib/mySpot'
import { waitPhrase } from '../lib/queue/display'
import { forecastQueue } from '../lib/queue/estimate'
import { supabase } from '../lib/supabase'
import { aroundClock, salonDay } from '../lib/time'
import type { Barber, QueueEntry } from '../lib/types'
import { useNow } from '../lib/useNow'
import { rise, stagger, transition, vibrate, vibration } from '../styles/motion'

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; entry: QueueEntry | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACTIVE = new Set(['waiting', 'called', 'in_chair'])

const appear = (i: number) => ({ ...rise, transition: { ...transition.card, delay: i * stagger.hero } })

/** Screen 3: My Status (docs/02-screens.md). */
export default function Status() {
  const { id = '' } = useParams()
  const live = useLiveQueue()
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [retry, setRetry] = useState(0)
  const [extraBarber, setExtraBarber] = useState<Barber | null>(null)

  // Load the spot; refetch whenever the live queue reloads (realtime triggers that).
  useEffect(() => {
    let stale = false
    if (!UUID.test(id)) {
      queueMicrotask(() => !stale && setLoad({ state: 'ready', entry: null }))
      return () => {
        stale = true
      }
    }
    supabase
      .from('queue_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (stale) return
        if (error) setLoad((prev) => (prev.state === 'ready' ? prev : { state: 'error', message: friendlyError(error) }))
        else setLoad({ state: 'ready', entry: (data as QueueEntry | null) ?? null })
      })
    return () => {
      stale = true
    }
  }, [id, live.version, retry])

  const entry = load.state === 'ready' && load.entry && load.entry.day === salonDay() ? load.entry : null
  const barberId = entry ? (entry.assigned_barber ?? entry.barber_pref) : null
  const liveBarber = barberId ? (live.barbers.find((b) => b.id === barberId) ?? null) : null

  // A barber who went off duty isn't in the live list: look them up once.
  useEffect(() => {
    if (!barberId || liveBarber || live.status !== 'ready') return
    let stale = false
    supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .maybeSingle()
      .then(({ data }) => !stale && setExtraBarber((data as Barber | null) ?? null))
    return () => {
      stale = true
    }
  }, [barberId, liveBarber, live.status])

  const barber = liveBarber ?? (extraBarber?.id === barberId ? extraBarber : null)

  // A no-show that reception re-added has a new spot (new id, new token) at the end of the queue.
  const readdedAs = entry?.status === 'no_show' ? currentSpot(entry.id, live.entries) : undefined

  // Remember an active spot on this phone (or the re-added one); forget a cancelled one.
  useEffect(() => {
    if (readdedAs) saveMySpot(readdedAs.id, readdedAs.token)
    else if (!entry) return
    else if (ACTIVE.has(entry.status)) saveMySpot(entry.id, entry.token)
    else if (entry.status === 'cancelled') clearMySpot()
  }, [entry, readdedAs])

  const salonName = live.settings?.salon_name ?? 'the salon'
  useEffect(() => {
    document.title = entry ? `${formatToken(entry.token)} · Your spot · Roselle` : 'Your spot · Roselle'
  }, [entry])

  // The circle reveal grows from where the token card was last seen.
  const tokenCardRef = useRef<HTMLDivElement>(null)
  const cardCentre = useRef<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const el = tokenCardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    cardCentre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })

  if (load.state === 'loading') return <Skeleton live={live.live} />
  if (load.state === 'error')
    return (
      <Shell live={live.live}>
        <EndCard icon={<CircleSlash size={28} />} title="Can't load your spot" body={load.message}>
          <PillButton onClick={() => setRetry((n) => n + 1)}>Try again</PillButton>
        </EndCard>
      </Shell>
    )

  if (!entry)
    return (
      <Shell live={live.live}>
        <EndCard icon={<CalendarX2 size={28} />} title="This spot isn't active any more" body="Links work only on the day you joined.">
          <PillButton to="/">Go to home</PillButton>
        </EndCard>
      </Shell>
    )

  const barberName = barber?.name ?? (entry.barber_pref === null ? 'your stylist' : 'your stylist')

  switch (entry.status) {
    case 'waiting':
      return <Waiting entry={entry} barber={barber} tokenCardRef={tokenCardRef} />
    case 'called':
      return (
        <>
          <Shell live={live.live}>
            <JourneyTracker step={2} />
          </Shell>
          <CalledTakeover token={entry.token} barber={barber} originRef={cardCentre} live={live.live} />
        </>
      )
    case 'in_chair':
      return (
        <Shell live={live.live}>
          <JourneyTracker step={3} />
          <InChair entry={entry} barber={barber} barberName={barberName} />
        </Shell>
      )
    case 'done':
      return (
        <Shell live={live.live}>
          <JourneyTracker step={4} />
          <motion.section {...appear(1)} className="rounded-card bg-surface px-5 py-7 text-center shadow-card">
            <h2 className="text-title font-extrabold tracking-tight">Thanks for visiting {salonName}!</h2>
            <div className="mt-5">
              <RateVisit id={entry.id} barberName={barberName} rating={entry.rating} onRated={() => setRetry((n) => n + 1)} />
            </div>
          </motion.section>
        </Shell>
      )
    case 'cancelled':
      return (
        <Shell live={live.live}>
          <EndCard
            icon={<CircleSlash size={28} />}
            title="Your spot was cancelled"
            body={entry.cancelled_by === 'salon' ? `The salon cancelled spot ${formatToken(entry.token)}.` : `You cancelled spot ${formatToken(entry.token)}.`}
          >
            <PillButton to="/join">Join again</PillButton>
          </EndCard>
        </Shell>
      )
    case 'no_show':
      if (readdedAs)
        return (
          <Shell live={live.live}>
            <EndCard
              icon={<RotateCcw size={28} />}
              title="You're back in the queue"
              body={`You're now ${formatToken(readdedAs.token)}, at the end of the queue.`}
            >
              <PillButton to={`/status/${readdedAs.id}`}>See my new spot</PillButton>
            </EndCard>
          </Shell>
        )
      return (
        <Shell live={live.live}>
          <EndCard icon={<UserX size={28} />} title="You missed your turn" body="Please speak to reception.">
            <PillButton variant="white" to="/">
              Go to home
            </PillButton>
          </EndCard>
        </Shell>
      )
  }
}

// ───────────────────────────── Waiting ─────────────────────────────

function Waiting({ entry, barber, tokenCardRef }: { entry: QueueEntry; barber: Barber | null; tokenCardRef: RefObject<HTMLDivElement | null> }) {
  const live = useLiveQueue()
  const now = useNow()
  const [cancelOpen, setCancelOpen] = useState(false)

  const forecast = useMemo(() => forecastQueue(live.barbers, live.entries, now), [live.barbers, live.entries, now])
  const estimate = forecast.byEntry.get(entry.id)
  const place = estimate?.place ?? null
  const wait = estimate ? estimate.wait : undefined // undefined = live queue not caught up yet

  // The ring is a countdown from the longest wait this spot has seen.
  const [maxWait, setMaxWait] = useState(0)
  if (typeof wait === 'number' && wait > maxWait) setMaxWait(wait)
  const fraction = typeof wait === 'number' && maxWait > 0 ? wait / maxWait : 0

  // Reaching 2nd: a short buzz (Motion moment 9). Place changes: shine sweep (moment 8).
  const lastPlace = useRef<number | null>(null)
  const [shine, setShine] = useState(0)
  useEffect(() => {
    if (place === null) return
    const before = lastPlace.current
    lastPlace.current = place
    if (before === null || before === place) return
    if (place === 2 && before > 2 && (navigator.userActivation?.hasBeenActive ?? true)) vibrate(vibration.startComing)
    setShine((n) => n + 1)
  }, [place])

  const prefName = barber?.name ?? 'Your stylist'
  const banner =
    wait === null
      ? entry.barber_pref
        ? `${prefName} is on break. Your wait will update when ${prefName} is back.`
        : 'No stylists available right now. Your wait will update soon.'
      : place === 1
        ? "You're next! Please be at the salon"
        : place === 2
          ? 'Start coming to the salon'
          : null

  const step = typeof wait === 'number' && place !== null && place <= 2 ? 1 : 0
  const services = entry.services.map((s) => s.name).join(' + ')
  const ahead = place !== null ? Math.max(0, place - 1) : null

  let turnLine: ReactNode = 'Working out your wait…'
  if (wait === null) turnLine = 'Your wait will update when your stylist is back.'
  else if (typeof wait === 'number' && place !== null) {
    const phrase = waitPhrase(wait, place)
    turnLine = (
      <>
        Your turn {phrase === 'any moment now' ? '' : 'in '}
        <strong className="num font-bold text-text">{phrase}</strong> · around <strong className="num font-bold text-text">{aroundClock(now, wait)}</strong>
      </>
    )
  }

  return (
    <Shell live={live.live} wide>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8">
        {/* Tracker + banner: top on phones, right column on desktop. */}
        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <motion.div {...appear(0)}>
            <JourneyTracker step={step} />
          </motion.div>
          <StatusBanner message={banner} glow={place === 1 && wait !== null} tone={wait === null ? 'muted' : 'accent'} />
        </div>

        {/* Ticket + ring: left column on desktop. */}
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <motion.div
            {...appear(1)}
            ref={tokenCardRef}
            className="relative mt-9 rounded-card bg-linear-to-br from-hero to-hero-2 px-5 pt-11 pb-6 text-center text-white shadow-pop"
          >
            <span className="absolute -top-9 left-1/2 grid size-[72px] -translate-x-1/2 place-items-center rounded-full bg-surface shadow-card">
              {entry.barber_pref && barber ? <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={56} /> : <AnyAvatar size={56} />}
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
              <AnimatePresence>
                {shine > 0 && (
                  <motion.span
                    key={shine}
                    className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/25 to-transparent"
                    initial={{ x: '-120%' }}
                    animate={{ x: '320%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>
            </span>
            <p className="text-caption font-bold tracking-[0.2em] text-white/70">TOKEN</p>
            <p className="num mt-1 text-token font-extrabold tracking-tight">{formatToken(entry.token)}</p>
            <p className="mt-2 text-small text-white/85">
              {services} · {entry.barber_pref ? prefName : 'Any stylist'}
            </p>
          </motion.div>

          <motion.section {...appear(2)} aria-label="Your place and wait" className="flex items-center gap-4 rounded-card bg-surface p-5 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="text-caption font-semibold text-muted">Your place</p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                {place !== null ? <Rolling value={ordinal(place)} className="text-big font-extrabold tracking-tight" /> : <span className="text-big font-extrabold text-surface-2">–</span>}
                <span className="text-small font-semibold">in line</span>
              </p>
              <p className="num mt-1.5 text-caption text-muted">
                {ahead !== null && (
                  <>
                    <Rolling value={ahead} /> ahead ·{' '}
                  </>
                )}
                joined {formatClock(new Date(entry.joined_at))}
              </p>
            </div>
            {wait === undefined ? (
              <span aria-hidden="true" className="size-[116px] shrink-0 animate-pulse rounded-full bg-surface-2" />
            ) : (
              <WaitRing wait={wait} fraction={fraction} place={place ?? 1} />
            )}
          </motion.section>
        </div>

        {/* Turn line + cancel. */}
        <div className="flex flex-col gap-2 lg:col-start-2 lg:row-start-2">
          <motion.p {...appear(3)} className="text-center text-small text-muted lg:text-left" aria-live="polite">
            {turnLine}
          </motion.p>
          <motion.div {...appear(4)} className="flex justify-center lg:justify-start">
            <button type="button" onClick={() => setCancelOpen(true)} className="min-h-11 px-3 text-small font-semibold text-muted underline underline-offset-2 hover:text-text lg:px-0">
              Cancel my spot
            </button>
          </motion.div>
        </div>
      </div>

      <CancelSheet open={cancelOpen} onClose={() => setCancelOpen(false)} entry={entry} />
    </Shell>
  )
}

function CancelSheet({ open, onClose, entry }: { open: boolean; onClose: () => void; entry: QueueEntry }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await cancelMySpot(entry.id)
      clearMySpot()
      onClose()
      void refreshQueue()
    } catch (e) {
      setError(friendlyError(e))
      void refreshQueue()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Cancel your spot ${formatToken(entry.token)}?`}>
      <p className="text-body text-muted">You'll lose your place.</p>
      {error && <p className="mt-3 text-small font-semibold text-danger">{error}</p>}
      <div className="mt-6 flex flex-col gap-3">
        <PillButton onClick={onClose}>Keep my spot</PillButton>
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="h-14 rounded-full bg-surface-2 text-body font-bold text-danger transition-opacity disabled:opacity-50"
        >
          {busy ? 'Cancelling…' : 'Cancel spot'}
        </button>
      </div>
    </Sheet>
  )
}

// ───────────────────────────── In chair ─────────────────────────────

function InChair({ entry, barber, barberName }: { entry: QueueEntry; barber: Barber | null; barberName: string }) {
  const now = useNow(1000)
  const since = entry.started_at ? Math.max(0, Math.floor((now - Date.parse(entry.started_at)) / 1000)) : 0
  const elapsed = `${Math.floor(since / 60)}:${String(since % 60).padStart(2, '0')}`

  return (
    <motion.section {...appear(1)} className="relative mt-9 rounded-card bg-linear-to-br from-hero to-hero-2 px-5 pt-11 pb-6 text-center text-white shadow-pop">
      <span className="absolute -top-9 left-1/2 grid size-[72px] -translate-x-1/2 place-items-center rounded-full bg-surface shadow-card">
        {barber ? <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={56} /> : <AnyAvatar size={56} />}
      </span>
      <h2 className="text-title font-extrabold tracking-tight">You're with {barberName}</h2>
      <p className="num mt-3 text-big font-extrabold tracking-tight" aria-label={`${Math.floor(since / 60)} minutes so far`}>
        {elapsed}
      </p>
      <p className="text-caption font-semibold text-white/70">time so far</p>
      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {entry.services.map((s) => (
          <li key={s.id} className="num rounded-full bg-white/15 px-3 py-1 text-caption font-semibold">
            {s.name} · {s.minutes} min
          </li>
        ))}
      </ul>
      <p className="num mt-4 text-caption text-white/70">Token {formatToken(entry.token)}</p>
    </motion.section>
  )
}

// ───────────────────────────── Shared bits ─────────────────────────────

function Shell({ live, wide = false, children }: { live: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <main className={`mx-auto flex min-h-dvh w-full flex-col gap-5 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] ${wide ? 'max-w-lg lg:max-w-5xl lg:px-8 lg:pt-8' : 'max-w-lg'}`}>
      <header className="flex items-center gap-3">
        <Link to="/" aria-label="Back to home" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface shadow-card">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-title font-bold">Your spot</h1>
        <LiveDot live={live} />
      </header>
      {children}
    </main>
  )
}

function EndCard({ icon, title, body, children }: { icon: ReactNode; title: string; body: string; children: ReactNode }) {
  return (
    <motion.section {...appear(1)} className="mt-6 flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-8 text-center shadow-card">
      <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-accent-tint text-accent">
        {icon}
      </span>
      <h2 className="mt-1 text-title font-extrabold tracking-tight">{title}</h2>
      <p className="text-small text-muted">{body}</p>
      <div className="mt-3 w-full">{children}</div>
    </motion.section>
  )
}

function Skeleton({ live }: { live: boolean }) {
  return (
    <Shell live={live}>
      <div aria-busy="true" aria-label="Loading your spot" className="flex flex-col gap-4">
        <span className="h-10 animate-pulse rounded-full bg-surface-2" />
        <span className="mt-9 h-44 animate-pulse rounded-card bg-surface-2" />
        <span className="h-36 animate-pulse rounded-card bg-surface-2" />
        <span className="mx-auto h-4 w-2/3 animate-pulse rounded-full bg-surface-2" />
      </div>
    </Shell>
  )
}
