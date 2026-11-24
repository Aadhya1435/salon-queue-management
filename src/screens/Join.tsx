import { Check, ChevronLeft, Clock3 } from 'lucide-react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnyAvatar, BarberAvatar } from '../components/BarberAvatar'
import { PhoneField, TextField } from '../components/Fields'
import { Rolling } from '../components/Numbers'
import PillButton from '../components/PillButton'
import Sheet from '../components/Sheet'
import YoureIn from '../components/YoureIn'
import { joinQueue } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { formatRupees, formatToken } from '../lib/format'
import { cleanName, MAX_SERVICES, nameError, phoneError, toggleService } from '../lib/joinForm'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { currentSpot, loadMySpot, saveMySpot } from '../lib/mySpot'
import { roundUpTo5, waitShort } from '../lib/queue/display'
import { forecastQueue, newCustomerWait } from '../lib/queue/estimate'
import { onlineJoinWindow } from '../lib/queue/joinWindow'
import { aroundClock, salonMinutes } from '../lib/time'
import type { JoinResult } from '../lib/types'
import { useNow } from '../lib/useNow'
import { rise, spring, stagger, transition, vibrate, vibration } from '../styles/motion'

const TILE_COLOURS = ['bg-blob-orchid', 'bg-blob-plum', 'bg-blob-mint', 'bg-blob-sky']
const shake = { x: [0, -7, 7, -4, 4, 0] }

/** Screen 2: Join Queue (docs/02-screens.md). */
export default function Join() {
  const live = useLiveQueue()
  const now = useNow()
  const navigate = useNavigate()
  const [scope, animate] = useAnimate<HTMLElement>()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState({ name: false, phone: false })
  const [selected, setSelected] = useState<string[]>([])
  const [barberId, setBarberId] = useState<string | null>(null) // null = Any barber
  const [limitHint, setLimitHint] = useState(false)
  const [submit, setSubmit] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<JoinResult | null>(null)
  const [joined, setJoined] = useState<JoinResult | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saved = useMemo(() => loadMySpot(), [])

  const { settings, services, barbers, entries } = live
  useEffect(() => {
    document.title = `Join the queue · ${settings?.salon_name ?? 'Roselle'}`
  }, [settings])

  // Services or barbers can change live (owner turns one off): drop stale choices.
  const chosen = selected.filter((id) => services.some((s) => s.id === id))
  const barber = barberId ? (barbers.find((b) => b.id === barberId) ?? null) : null
  const effectiveBarberId = barber?.id ?? null

  const forecast = useMemo(() => forecastQueue(barbers, entries, now), [barbers, entries, now])
  const wait = newCustomerWait(forecast, effectiveBarberId)
  const totals = chosen.reduce(
    (t, id) => {
      const s = services.find((x) => x.id === id)!
      return { minutes: t.minutes + s.minutes, price: t.price + s.price }
    },
    { minutes: 0, price: 0 },
  )
  const window_ = settings ? onlineJoinWindow(settings, barbers, salonMinutes(new Date(now))) : null
  // This phone's spot (or the new one after a Re-add), if it is still active.
  const savedActive = saved ? (currentSpot(saved.id, entries) ?? null) : null

  const nameProblem = nameError(name)
  const phoneProblem = phoneError(phone)
  const missing = nameProblem ? 'Add your name' : phoneProblem ? 'Enter a valid mobile number' : chosen.length === 0 ? 'Pick at least one service' : null
  const canConfirm = !missing && window_?.open === true && submit === 'idle'

  function onToggle(id: string) {
    const result = toggleService(chosen, id)
    if (result.refused) {
      animate(`[data-service="${id}"]`, shake, { duration: 0.4 })
      vibrate(vibration.refused)
      setLimitHint(true)
      clearTimeout(hintTimer.current)
      hintTimer.current = setTimeout(() => setLimitHint(false), 1600)
      return
    }
    vibrate(vibration.tap)
    setSelected(result.selected)
  }

  async function onConfirm() {
    if (!canConfirm) return
    setSubmit('loading')
    setError(null)
    try {
      const result = await joinQueue({ name: cleanName(name), phone, serviceIds: chosen, barberId: effectiveBarberId })
      if (result.existing) {
        setSubmit('idle')
        setExisting(result)
        return
      }
      saveMySpot(result.id, result.token)
      setSubmit('done')
      void refreshQueue() // so the celebration can show the new place
      setTimeout(() => setJoined(result), 380)
    } catch (e) {
      setSubmit('idle')
      setError(friendlyError(e))
      animate('#join-error', shake, { duration: 0.4 })
      void refreshQueue()
    }
  }

  const goToSpot = useCallback(() => {
    if (joined) navigate(`/status/${joined.id}`, { replace: true })
  }, [joined, navigate])

  const joinedEstimate = joined ? forecast.byEntry.get(joined.id) : undefined
  const ready = live.status === 'ready'
  // The salon's data couldn't be loaded at all (offline, or the server is down).
  const failed = live.status === 'error'
  const [retrying, setRetrying] = useState(false)

  async function retry() {
    setRetrying(true)
    await refreshQueue()
    setRetrying(false)
  }

  return (
    <main ref={scope} className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <Link to="/" aria-label="Back to home" className="grid size-11 place-items-center rounded-full bg-surface shadow-card">
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
        <h1 className="text-title font-bold">Join the queue</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-6">
        {savedActive && (
          <Link to={`/status/${savedActive.id}`} className="flex items-center justify-between gap-3 rounded-card bg-accent-tint px-4 py-3 text-small font-semibold">
            <span>
              This phone is already in the queue as <span className="num">{formatToken(savedActive.token)}</span>
            </span>
            <span className="shrink-0 underline underline-offset-2">View</span>
          </Link>
        )}
        {window_ && !window_.open && (
          <p role="status" className="rounded-card bg-warning-tint px-4 py-3 text-small font-semibold text-warning">
            {window_.message}
          </p>
        )}

        {/* ── You ── */}
        <section aria-label="Your details" className="flex flex-col gap-4">
          <TextField
            id="join-name"
            label="Name"
            placeholder="Your name"
            autoComplete="name"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={touched.name ? nameProblem : null}
          />
          <PhoneField
            id="join-phone"
            digits={phone}
            onDigits={setPhone}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={touched.phone ? phoneProblem : null}
          />
        </section>

        {/* ── Services ── */}
        <section aria-labelledby="services-title">
          <h2 id="services-title" className="flex items-center gap-2 text-body font-bold">
            Services
            <motion.span
              key={chosen.length}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={spring.pop}
              className="num grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-caption font-bold text-on-accent"
            >
              {chosen.length}
            </motion.span>
            <span aria-live="polite" className={`text-caption ${limitHint ? 'font-bold text-accent' : 'font-medium text-muted'}`}>
              {limitHint ? `Up to ${MAX_SERVICES} services` : `up to ${MAX_SERVICES}`}
            </span>
          </h2>
          {failed && (
            <div role="alert" className="mt-3 flex flex-col items-start gap-1.5 rounded-card bg-surface p-5 shadow-card">
              <p className="text-body font-bold">Can't reach the salon right now.</p>
              <p className="text-small text-muted">{live.error ?? 'Please check your connection.'}</p>
              <button
                type="button"
                onClick={() => void retry()}
                disabled={retrying}
                className="mt-2 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-small font-bold text-on-primary disabled:opacity-60"
              >
                {retrying ? 'Trying…' : 'Try again'}
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {!ready && !failed && [0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className="h-[86px] animate-pulse rounded-tile bg-surface-2" />)}
            {services.map((s, i) => {
              const on = chosen.includes(s.id)
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  data-service={s.id}
                  aria-pressed={on}
                  onClick={() => onToggle(s.id)}
                  whileTap={{ scale: 0.94 }}
                  {...rise}
                  transition={{ ...transition.card, delay: i * 0.04 }}
                  className={`relative flex min-h-[86px] flex-col items-start rounded-tile bg-surface p-3 text-left shadow-card ring-2 transition-shadow ${
                    on ? 'ring-primary' : 'ring-transparent'
                  }`}
                >
                  <span aria-hidden="true" className={`mb-2 size-4 rounded-full ${TILE_COLOURS[i % TILE_COLOURS.length]}`} />
                  <span className="text-small font-bold">{s.name}</span>
                  <span className="num text-caption text-muted">
                    {s.minutes} min · {formatRupees(s.price)}
                  </span>
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={spring.pop}
                        className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full bg-primary text-on-primary"
                      >
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* ── Barber ── */}
        <section aria-labelledby="barber-title" hidden={failed}>
          <h2 id="barber-title" className="text-body font-bold">
            Stylist
          </h2>
          <div role="radiogroup" aria-labelledby="barber-title" className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pt-1 pb-2 [scrollbar-width:none]">
            {[null, ...barbers].map((b, i) => {
              const id = b?.id ?? null
              const isSelected = id === effectiveBarberId
              const w = newCustomerWait(forecast, id)
              return (
                <motion.button
                  key={id ?? 'any'}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    vibrate(vibration.tap)
                    setBarberId(id)
                  }}
                  whileTap={{ scale: 0.96 }}
                  initial={rise.initial}
                  animate={rise.animate}
                  transition={{ ...transition.card, delay: 0.1 + i * stagger.list }}
                  className={`relative flex min-w-[calc((100%-1.5rem)/4)] flex-1 flex-col items-center gap-1 rounded-tile bg-surface px-1 pt-3 pb-2.5 shadow-card ${
                    b?.on_break ? 'opacity-55' : ''
                  }`}
                >
                  {isSelected && <motion.span layoutId="barber-ring" transition={spring.soft} className="absolute inset-0 rounded-tile bg-accent-tint ring-2 ring-primary" />}
                  <span className="relative flex flex-col items-center gap-1">
                    {b ? <BarberAvatar name={b.name} color={b.color} shape={b.shape} size={34} /> : <AnyAvatar size={34} />}
                    {b ? (
                      <span className="max-w-full truncate text-small font-bold">{b.name}</span>
                    ) : (
                      <span className="max-w-full text-center text-small leading-tight font-bold">Any stylist</span>
                    )}
                    <span className="num text-caption text-muted">{b?.on_break ? 'On break' : w === null ? '—' : waitShort(w)}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── Sticky footer: your turn + Confirm ── */}
      <footer className="sticky bottom-0 z-10 flex flex-col gap-3 bg-linear-to-t from-bg via-bg to-bg/0 px-5 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {error && (
            <motion.p
              id="join-error"
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-card bg-surface px-4 py-3 text-small font-semibold text-danger shadow-card"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {!failed && (
          <TurnStrip
            wait={wait}
            now={now}
            barberName={barber?.name ?? null}
            onBreak={Boolean(barber?.on_break)}
            services={chosen.length}
            minutes={totals.minutes}
          />
        )}
        <PillButton onClick={onConfirm} disabled={!canConfirm && submit === 'idle'} state={submit}>
          Confirm{chosen.length > 0 && <span className="num"> · {formatRupees(totals.price)}</span>}
        </PillButton>
        {failed && <p className="-mt-1 text-center text-caption text-muted">Reconnect to join the queue</p>}
        {window_?.open && missing && submit === 'idle' && <p className="-mt-1 text-center text-caption text-muted">{missing} to continue</p>}
      </footer>

      <Sheet open={existing !== null} onClose={() => setExisting(null)} title="You're already in the queue">
        {existing && (
          <div className="flex flex-col gap-4">
            <p className="text-body text-muted">
              This phone number already has a spot today: <b className="num text-text">{formatToken(existing.token)}</b>. You can only have one spot at a time.
            </p>
            <PillButton
              onClick={() => {
                saveMySpot(existing.id, existing.token)
                navigate(`/status/${existing.id}`)
              }}
            >
              View my spot
            </PillButton>
          </div>
        )}
      </Sheet>

      <AnimatePresence>
        {joined && <YoureIn token={joined.token} place={joinedEstimate?.place ?? null} wait={joinedEstimate?.wait ?? null} onContinue={goToSpot} />}
      </AnimatePresence>
    </main>
  )
}

type TurnStripProps = { wait: number | null; now: number; barberName: string | null; onBreak: boolean; services: number; minutes: number }

/** "Your turn in about 50 min · around 3:00 PM" (docs/02-screens.md → Screen 2, item 5). */
function TurnStrip({ wait, now, barberName, onBreak, services, minutes }: TurnStripProps) {
  const detail = services > 0 ? `${services} service${services === 1 ? '' : 's'} · ${minutes} min` : 'pick a service'
  let main: React.ReactNode
  let sub: string
  if (onBreak && barberName) {
    main = `${barberName} is on break`
    sub = `No estimate until ${barberName} is back`
  } else if (wait === null) {
    main = 'No stylists available'
    sub = detail
  } else if (wait < 1) {
    main = 'No wait right now'
    sub = `A stylist is free · ${detail}`
  } else {
    main = (
      <>
        Your turn in about <Rolling value={roundUpTo5(wait)} className="text-title font-extrabold" /> min
      </>
    )
    sub = `around ${aroundClock(now, wait)} · ${detail}`
  }
  return (
    <div className="flex items-center gap-3 rounded-tile bg-surface px-4 py-3 shadow-card" aria-live="polite">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent">
        <Clock3 size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-small font-bold">{main}</p>
        <p className="num truncate text-caption text-muted">{sub}</p>
      </div>
    </div>
  )
}
