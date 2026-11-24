import { Lock, Plus } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LiveDot from '../components/LiveDot'
import PinGate from '../components/PinGate'
import Sheet from '../components/Sheet'
import BarberCard, { type BarberAction } from '../components/reception/BarberCard'
import NoShows from '../components/reception/NoShows'
import { displayName } from '../components/reception/format'
import { useStaffQueue } from '../components/reception/useStaffQueue'
import WaitingList from '../components/reception/WaitingList'
import WalkInPanel from '../components/reception/WalkInPanel'
import { callNext, cancelEntry, finishService, markNoShow, readd, setBreak, startService } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { formatClock, formatTimeOfDay, formatToken } from '../lib/format'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { byQueueOrder, forecastQueue } from '../lib/queue/estimate'
import { ONLINE_CLOSES_BEFORE_CLOSING, onlineJoinWindow } from '../lib/queue/joinWindow'
import { handleStaffError, lockStaff, useStaffSession } from '../lib/staff'
import { salonMinutes, timeToMinutes } from '../lib/time'
import type { Barber, StaffQueueEntry } from '../lib/types'
import { useNow } from '../lib/useNow'
import { spring } from '../styles/motion'
import BackButton from '../components/BackButton'

/** Screen 4: Reception Dashboard (docs/02-screens.md). */
export default function Reception() {
  return (
    <PinGate need="staff">
      <Dashboard />
    </PinGate>
  )
}

const ACTIVE = new Set(['waiting', 'called', 'in_chair'])

function Dashboard() {
  const session = useStaffSession()
  const pin = session?.pin ?? ''
  const live = useLiveQueue()
  const now = useNow(1000)
  const { rows, error: loadError, refetch } = useStaffQueue(pin, live.version)
  const { settings, barbers, services } = live

  const [walkInOpen, setWalkInOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<StaffQueueEntry | null>(null)
  // One entry per running action (stylist id or queue entry id → action), so two stylists'
  // actions can run at once and finishing one doesn't re-enable the other's buttons early.
  const [busy, setBusy] = useState<Record<string, BarberAction | 'cancel' | 'readd'>>({})
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    document.title = settings ? `Reception · ${settings.salon_name}` : 'Reception · Roselle'
  }, [settings])

  const all = useMemo(() => rows ?? [], [rows])
  const active = useMemo(() => all.filter((e) => ACTIVE.has(e.status)), [all])
  const waiting = useMemo(() => active.filter((e) => e.status === 'waiting').sort(byQueueOrder), [active])
  // Forecast recomputes on the 1 s tick; it's a small pure function.
  const forecast = useMemo(() => forecastQueue(barbers, active, now), [barbers, active, now])

  /** Runs one staff call, then refetches whatever happened. */
  const run = useCallback(
    async (key: string, action: BarberAction | 'cancel' | 'readd', call: () => Promise<string | void>) => {
      setBusy((b) => ({ ...b, [key]: action }))
      try {
        const note = await call()
        if (note) showToast(note)
      } catch (e) {
        handleStaffError(e)
        showToast(friendlyError(e))
      } finally {
        await refetch()
        setBusy((b) => {
          const next = { ...b }
          delete next[key]
          return next
        })
        void refreshQueue()
      }
    },
    [refetch, showToast],
  )

  function onBarberAction(barber: Barber, action: BarberAction, entry: StaffQueueEntry | null) {
    void run(barber.id, action, async () => {
      switch (action) {
        case 'call': {
          const called = await callNext(pin, barber.id)
          return called ? undefined : `No one waiting for ${barber.name}`
        }
        case 'start':
          if (entry) await startService(pin, entry.id)
          return
        case 'done':
          if (entry) await finishService(pin, entry.id)
          return
        case 'no_show':
          if (entry) await markNoShow(pin, entry.id)
          return entry ? `${formatToken(entry.token)} marked as no-show` : undefined
        case 'break':
        case 'available':
          await setBreak(pin, barber.id, action === 'break')
          return
      }
    })
  }

  function confirmCancel() {
    const target = cancelTarget
    if (!target) return
    setCancelTarget(null)
    void run(target.id, 'cancel', async () => {
      await cancelEntry(pin, target.id)
      return `${formatToken(target.token)} cancelled`
    })
  }

  function onReadd(entry: StaffQueueEntry) {
    void run(entry.id, 'readd', async () => {
      const r = await readd(pin, entry.id)
      return r.existing ? `Already in the queue as ${formatToken(r.token)}` : `Re-added as ${formatToken(r.token)} at the end`
    })
  }

  // Top bar: the online-queue pill.
  const nowMinutes = salonMinutes(new Date(now))
  const onlineOpen = settings ? onlineJoinWindow(settings, barbers, nowMinutes, services.length).open : false
  const onlineUntil = settings ? minutesToClock(timeToMinutes(settings.close_time) - ONLINE_CLOSES_BEFORE_CLOSING) : ''

  const ready = rows !== null && live.status !== 'loading'
  const gridCols = barbers.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : barbers.length === 3 ? 'sm:grid-cols-2 md:grid-cols-3' : 'sm:grid-cols-2'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-5 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6">
      {/* ── Top bar ── */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card bg-linear-to-br from-hero to-hero-2 px-4 py-3 text-white shadow-card md:px-5">
        <div className="flex min-w-0 basis-full items-center gap-3 sm:basis-0 sm:flex-1">
          <BackButton to="/staff" label="Staff" tone="dark" />
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-body font-extrabold text-primary">
            {(settings?.salon_name ?? 'Roselle').charAt(0)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-body font-bold">{settings?.salon_name ?? 'Roselle'} · Reception</h1>
            <p className="flex items-center gap-3">
              <LiveDot live={live.live} onDark />
              <span className="num text-caption font-semibold whitespace-nowrap text-white/80">{formatClock(new Date(now))}</span>
            </p>
          </div>
        </div>
        <span
          className={`num inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-caption font-semibold ${onlineOpen ? 'bg-white/15 text-white' : 'bg-white/10 text-white/75'}`}
        >
          <span aria-hidden="true" className={`size-2 rounded-full ${onlineOpen ? 'bg-blob-mint' : 'bg-break'}`} />
          {settings ? (onlineOpen ? `Online: open until ${onlineUntil}` : 'Online: closed') : 'Online: …'}
        </span>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setWalkInOpen(true)}
            disabled={!ready}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-small font-bold text-primary shadow-pop disabled:opacity-60"
          >
            <Plus size={18} strokeWidth={2.6} aria-hidden="true" /> Add walk-in
          </motion.button>
          <button
            type="button"
            onClick={lockStaff}
            className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-small font-semibold text-white/85 hover:bg-white/10"
          >
            <Lock size={16} aria-hidden="true" /> Lock
          </button>
        </div>
      </header>

      {(loadError || live.status === 'error') && (
        <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-tile bg-warning-tint px-4 py-2 text-small font-semibold text-warning">
          <span>
            {rows === null ? "Can't load the queue." : "Can't refresh the queue: showing the last update."}{' '}
            <span className="font-medium">{loadError ?? live.error}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              void refetch()
              void refreshQueue()
            }}
            className="min-h-11 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <LayoutGroup>
        {/* ── Barber cards ── */}
        <section aria-label="Stylists on duty">
          {!ready ? (
            <div className={`grid gap-4 ${gridCols}`}>
              {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true" className="h-64 animate-pulse rounded-card bg-surface-2" />
              ))}
            </div>
          ) : barbers.length === 0 ? (
            <p className="rounded-card bg-surface p-5 text-small text-muted shadow-card">No stylists on duty today.</p>
          ) : (
            <div className={`grid gap-4 ${gridCols}`}>
              {barbers.map((b) => (
                <BarberCard
                  key={b.id}
                  barber={b}
                  rows={active}
                  now={now}
                  busy={(busy[b.id] as BarberAction | undefined) ?? null}
                  onAction={(action, entry) => onBarberAction(b, action, entry)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Waiting list ── */}
        {ready ? (
          <WaitingList waiting={waiting} barbers={barbers} forecast={forecast} now={now} onCancel={setCancelTarget} />
        ) : (
          <div aria-hidden="true" className="h-48 animate-pulse rounded-card bg-surface-2" />
        )}
      </LayoutGroup>

      {ready && <NoShows rows={all} busyId={Object.keys(busy).find((k) => busy[k] === 'readd') ?? null} onReadd={onReadd} />}

      {/* ── Cancel confirm ── */}
      <Sheet
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title={cancelTarget ? `Cancel ${formatToken(cancelTarget.token)} (${displayName(cancelTarget)})?` : 'Cancel spot?'}
      >
        <p className="mb-5 text-small text-muted">They'll be removed from the queue. This can't be undone.</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setCancelTarget(null)} className="min-h-14 rounded-full bg-surface-2 text-body font-bold text-text">
            Keep
          </button>
          <button type="button" onClick={confirmCancel} className="min-h-14 rounded-full bg-danger text-body font-bold text-white">
            Cancel spot
          </button>
        </div>
      </Sheet>

      <WalkInPanel
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        pin={pin}
        services={services}
        barbers={barbers}
        forecast={forecast}
        onAdded={() => {
          void refetch()
          void refreshQueue()
        }}
      />

      {/* ── Toast ── */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={spring.soft}
              className="pointer-events-auto max-w-md rounded-full bg-primary px-5 py-3 text-small font-semibold text-on-primary shadow-pop"
            >
              {toast.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </main>
  )
}

/** 1230 → "8:30 PM". */
function minutesToClock(minutes: number): string {
  return formatTimeOfDay(`${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:00`)
}
