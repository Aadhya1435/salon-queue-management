import { AnimatePresence, motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BarberAvatar } from '../components/BarberAvatar'
import BlobCluster from '../components/BlobCluster'
import { goFullscreen, keepAwake, playChime, releaseWakeLock, unlockChime } from '../components/display/tvDevice'
import LiveDot from '../components/LiveDot'
import { formatClock, formatTimeOfDay, formatToken } from '../lib/format'
import { useLiveQueue } from '../lib/liveQueue'
import { barberNow, forecastQueue, type BarberNow } from '../lib/queue/estimate'
import { ONLINE_CLOSES_BEFORE_CLOSING, onlineJoinWindow, openStatus } from '../lib/queue/joinWindow'
import { aroundClock, salonMinutes, timeToMinutes } from '../lib/time'
import type { Barber, Settings } from '../lib/types'
import { useNow } from '../lib/useNow'
import { duration, ease, spring } from '../styles/motion'

/** How long a call stays on screen: the row floods and glows, the banner shows (Motion moment 19). */
const CALL_MS = 4000

type Flash = { id: string; barberId: string; token: number; barberName: string }

/** Screen 6: Waiting-Area TV (docs/02-screens.md). Public; first names only. */
export default function Display() {
  const live = useLiveQueue()
  const now = useNow(1000)
  const [started, setStarted] = useState(false)
  const { settings, barbers, entries } = live
  const ready = live.status === 'ready'

  // ── Detect new calls by diffing the Called entries against the last render ──
  const called = entries.filter((e) => e.status === 'called' && e.assigned_barber)
  const calledKey = called.map((e) => e.id).sort().join(',')
  const [seen, setSeen] = useState<{ key: string; ids: Set<string> } | null>(null)
  const [flashes, setFlashes] = useState<Flash[]>([])
  if (ready && seen?.key !== calledKey) {
    if (seen) {
      const fresh = called
        .filter((e) => !seen.ids.has(e.id))
        .map((e) => ({ id: e.id, barberId: e.assigned_barber!, token: e.token, barberName: barbers.find((b) => b.id === e.assigned_barber)?.name ?? '' }))
      if (fresh.length) setFlashes((f) => [...f.filter((x) => !fresh.some((n) => n.barberId === x.barberId)), ...fresh])
    }
    setSeen({ key: calledKey, ids: new Set(called.map((e) => e.id)) })
  }

  // Chime once per new call, and clear each call after CALL_MS.
  const latest = flashes.at(-1)
  const chimed = useRef(new Set<string>())
  useEffect(() => {
    if (!latest || chimed.current.has(latest.id)) return
    chimed.current.add(latest.id)
    playChime()
  }, [latest])
  useEffect(() => {
    if (flashes.length === 0) return
    const timers = flashes.map((f) => setTimeout(() => setFlashes((all) => all.filter((x) => x.id !== f.id)), CALL_MS))
    return () => timers.forEach(clearTimeout)
  }, [flashes])

  // Keep the screen awake: the lock drops whenever the tab is hidden.
  useEffect(() => {
    if (!started) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void keepAwake()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      releaseWakeLock()
    }
  }, [started])

  useEffect(() => {
    document.title = settings ? `${settings.salon_name} · Queue` : 'Roselle · Queue'
  }, [settings])

  function start() {
    unlockChime()
    void keepAwake()
    goFullscreen()
    setStarted(true)
  }

  const minuteNow = Math.floor(now / 60_000) * 60_000
  const upNext = useMemo(() => {
    const forecast = forecastQueue(barbers, entries, minuteNow)
    return entries
      .filter((e) => e.status === 'waiting')
      .map((e) => ({ entry: e, est: forecast.byEntry.get(e.id)! }))
      .filter((x) => x.est && x.est.wait !== null)
      .sort((a, b) => a.est.place - b.est.place)
      .slice(0, 5)
  }, [barbers, entries, minuteNow])
  const waitingCount = entries.filter((e) => e.status === 'waiting').length

  const joinUrl = `${location.origin}/join`
  const shortUrl = `${location.host}/join`
  const salonName = settings?.salon_name ?? 'Roselle'

  return (
    <main className="fixed inset-0 overflow-hidden bg-tv-bg text-tv-text select-none">
      <div className="grid h-full grid-cols-[65fr_35fr] grid-rows-[minmax(0,1fr)_auto] gap-x-[2vw] gap-y-[2vh] px-[2.5vw] pt-[3.5vh] pb-[2.5vh]">
        {/* ── Left: barbers ── */}
        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between gap-[2vw] pb-[2.5vh]">
            <div className="flex min-w-0 items-center gap-[1.2vw]">
              <span aria-hidden="true" className="grid size-[6vh] shrink-0 place-items-center rounded-full bg-tv-text text-[3.4vh] font-extrabold text-tv-bg">
                {salonName.charAt(0)}
              </span>
              <h1 className="truncate text-[4.6vh] leading-none font-extrabold tracking-tight">{salonName}</h1>
              <span className="[&_span]:text-[1.8vh]">
                <LiveDot live={live.live} onDark />
              </span>
            </div>
            <p className="num shrink-0 text-[4.6vh] leading-none font-bold">{formatClock(new Date(now))}</p>
          </header>

          <ul className="flex min-h-0 flex-1 flex-col gap-[2vh]">
            {!ready &&
              [0, 1, 2].map((i) => <li key={i} aria-hidden="true" className="flex-1 animate-pulse rounded-[3vh] bg-tv-surface" />)}
            {ready && barbers.length === 0 && (
              <li className="grid flex-1 place-items-center rounded-[3vh] bg-tv-surface text-[4vh] text-tv-muted">No stylists on duty right now.</li>
            )}
            {ready &&
              barbers.map((b) => (
                <BarberRow key={b.id} barber={b} state={barberNow(b, entries, now)} flash={flashes.find((f) => f.barberId === b.id) ?? null} />
              ))}
          </ul>
        </section>

        {/* ── Right: up next + QR ── */}
        <aside className="flex min-h-0 flex-col rounded-[3vh] bg-tv-surface px-[2vw] py-[3vh]">
          {ready && waitingCount === 0 ? (
            <EmptyState settings={settings} now={now} joinUrl={joinUrl} shortUrl={shortUrl} />
          ) : (
            <>
              <h2 className="flex items-baseline justify-between text-[3vh] font-bold tracking-wide text-tv-muted uppercase">
                Up next
                {waitingCount > 0 && <span className="num text-[2.6vh] normal-case">{waitingCount} waiting</span>}
              </h2>
              <ol className="mt-[1.5vh] flex min-h-0 flex-1 flex-col">
                <AnimatePresence mode="popLayout" initial={false}>
                  {upNext.map(({ entry, est }) => (
                    <motion.li
                      key={entry.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: '-40%' }}
                      transition={{ duration: duration.slow, ease: ease.out }}
                      className="flex h-[10.4vh] shrink-0 items-center gap-[1.2vw] border-b border-tv-line last:border-b-0"
                    >
                      <span className="num min-w-[12vw] shrink-0 text-[8.9vh] whitespace-nowrap leading-none font-extrabold tracking-tight">{formatToken(entry.token)}</span>
                      <span className="min-w-0 flex-1 truncate text-[3.6vh] font-semibold">{entry.first_name}</span>
                      <span className="num shrink-0 text-[3.2vh] text-tv-muted">~{aroundClock(now, est.wait!)}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
              <div className="mt-[2vh] flex items-center gap-[1.4vw]">
                <div className="shrink-0 rounded-[2vh] bg-white p-[1.2vh]">
                  <QRCodeSVG value={joinUrl} className="size-[15vh]" marginSize={0} />
                </div>
                <div className="min-w-0">
                  <p className="text-[3.2vh] leading-tight font-extrabold">Scan to join · skip the wait</p>
                  <p className="mt-[0.8vh] truncate text-[2.4vh] text-tv-muted">{shortUrl}</p>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* ── Footer line ── */}
        <footer className="col-span-2 flex items-center justify-between text-[2.6vh] text-tv-muted">
          <span>{footerLine(settings, barbers, now)}</span>
          <span className="flex items-center gap-[0.6vw] font-semibold">
            <img src="/favicon.svg" alt="" className="size-[2.6vh] rounded" /> Roselle
          </span>
        </footer>
      </div>

      {/* ── "S-14 → Amit" banner (4 s) ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center pt-[2.5vh]">
        <AnimatePresence>
          {latest && (
            <motion.p
              key={latest.id}
              role="status"
              initial={{ y: '-160%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-160%', opacity: 0 }}
              transition={spring.pop}
              className="num rounded-full bg-tv-accent px-[3vw] py-[1.6vh] text-[6.5vh] leading-none font-extrabold text-tv-on-accent shadow-pop"
            >
              {formatToken(latest.token)} → {latest.barberName}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Start overlay ── */}
      <AnimatePresence>
        {!started && (
          <motion.button
            type="button"
            onClick={start}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-[2vh] bg-tv-bg/85 text-tv-text backdrop-blur-sm"
          >
            <span className="rounded-full bg-tv-accent px-[3vw] py-[2.4vh] text-[5vh] font-extrabold text-tv-on-accent">Tap to start display</span>
            <span className="text-[2.6vh] text-tv-muted">Turns on the chime, keeps the screen awake and goes full screen</span>
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  )
}

function BarberRow({ barber, state, flash }: { barber: Barber; state: BarberNow; flash: Flash | null }) {
  const lit = flash !== null
  return (
    <li className="relative flex max-h-[30vh] min-h-0 flex-1 items-center gap-[2vw] overflow-hidden rounded-[3vh] bg-tv-surface px-[2.4vw]">
      {/* Accent floods from the left, then glows 3 times */}
      <AnimatePresence>
        {flash && (
          <motion.span
            key={flash.id}
            aria-hidden="true"
            className="absolute inset-0 origin-left bg-tv-accent"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: [1, 1, 0.55, 1, 0.55, 1, 0.55, 1] }}
            exit={{ opacity: 0 }}
            transition={{
              scaleX: { duration: 0.55, ease: ease.out },
              opacity: { duration: 3, times: [0, 0.18, 0.32, 0.46, 0.6, 0.74, 0.88, 1] },
              default: { duration: 0.6 },
            }}
          />
        )}
      </AnimatePresence>

      <span className="relative size-[12vh] shrink-0 [&>svg]:size-full">
        <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={40} />
      </span>
      <span
        className={`relative min-w-0 flex-1 truncate text-[5.4vh] font-extrabold tracking-tight transition-colors duration-500 ${lit ? 'text-tv-on-accent' : 'text-tv-text'}`}
      >
        {barber.name}
      </span>

      <span className="relative flex shrink-0 items-baseline gap-[1.2vw]">
        {state.kind === 'busy' ? (
          <>
            <span className={`text-[3.4vh] font-bold tracking-wide transition-colors duration-500 ${lit ? 'text-tv-on-accent' : 'text-tv-muted'}`}>NOW</span>
            <motion.span
              key={lit ? flash.id : `still-${state.token}`}
              initial={lit ? { scale: 1.15, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.pop}
              className={`num inline-block origin-right text-[min(17vh,9.5vw)] leading-[0.9] font-extrabold tracking-tight transition-colors duration-500 ${lit ? 'text-tv-on-accent' : 'text-tv-accent'}`}
            >
              {formatToken(state.token)}
            </motion.span>
          </>
        ) : state.kind === 'break' ? (
          <span className="text-[6vh] font-bold text-tv-muted">On break</span>
        ) : (
          <span className="text-[7vh] font-extrabold text-tv-text">Free</span>
        )}
      </span>
    </li>
  )
}

function EmptyState({ settings, now, joinUrl, shortUrl }: { settings: Settings | null; now: number; joinUrl: string; shortUrl: string }) {
  const status = settings ? openStatus(settings, salonMinutes(new Date(now))) : null
  const closed = status !== null && !status.open
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[4vh] text-center">
      <h2 className="text-[5vh] leading-tight font-extrabold tracking-tight">
        {closed ? `We're closed · Opens ${formatTimeOfDay(settings!.open_time)}` : 'No one waiting — walk right in!'}
      </h2>
      <div className="relative">
        {/* Motion moment 21: the blob cluster orbits slowly around the QR code */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[5vh]"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <BlobCluster className="absolute -top-[2vh] -right-[3vh] w-[13vh]" />
        </motion.div>
        <div className="relative rounded-[3vh] bg-white p-[2.4vh] shadow-pop">
          <QRCodeSVG value={joinUrl} className="size-[30vh]" marginSize={0} />
        </div>
      </div>
      <div>
        <p className="text-[3.6vh] font-extrabold">Scan to join · skip the wait</p>
        <p className="mt-[0.8vh] text-[2.6vh] text-tv-muted">{shortUrl}</p>
      </div>
    </div>
  )
}

function footerLine(settings: Settings | null, barbers: Barber[], now: number): string {
  if (!settings) return ' '
  const minutes = salonMinutes(new Date(now))
  const status = openStatus(settings, minutes)
  if (!status.open) return status.label.replace('Closed · opens', "We're closed · Opens")
  const window = onlineJoinWindow(settings, barbers, minutes)
  if (!window.open) return 'Walk-ins only right now'
  const lastJoin = timeToMinutes(settings.close_time) - ONLINE_CLOSES_BEFORE_CLOSING
  const hhmm = `${String(Math.floor(lastJoin / 60)).padStart(2, '0')}:${String(lastJoin % 60).padStart(2, '0')}`
  return `Online queue open until ${formatTimeOfDay(hhmm)}`
}

