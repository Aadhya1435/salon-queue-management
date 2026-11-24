import { ChevronRight, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { BarberAvatar } from '../components/BarberAvatar'
import PinGate from '../components/PinGate'
import { refreshQueue, useLiveQueue } from '../lib/liveQueue'
import { barberNow } from '../lib/queue/estimate'
import { lockStaff } from '../lib/staff'
import { useNow } from '../lib/useNow'
import { rise, stagger, transition } from '../styles/motion'
import { StatusChip } from '../components/barber/StatusChip'

/** Screen 5: `/barber` picks which barber this phone is for (docs/02-screens.md). */
export default function BarberPicker() {
  return (
    <PinGate need="staff">
      <Picker />
    </PinGate>
  )
}

function Picker() {
  const live = useLiveQueue()
  const now = useNow()
  const ready = live.status === 'ready'

  useEffect(() => {
    document.title = 'Which barber? · Roselle'
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <header className="flex items-center justify-between gap-3">
        <Link to="/staff" className="flex min-h-11 items-center text-small font-semibold text-muted">
          ‹ Staff
        </Link>
        <button
          type="button"
          onClick={lockStaff}
          aria-label="Lock"
          className="grid size-11 place-items-center rounded-full bg-surface text-text shadow-card"
        >
          <Lock size={18} aria-hidden="true" />
        </button>
      </header>

      <h1 className="mt-4 text-heading font-extrabold tracking-tight">Which barber are you?</h1>
      <p className="mt-1 text-small text-muted">Pick your name once. Bookmark the page on this phone.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {!ready && live.status !== 'error' && [0, 1, 2].map((i) => <li key={i} aria-hidden="true" className="h-24 animate-pulse rounded-card bg-surface-2" />)}
        {live.status === 'error' && (
          <li className="rounded-card bg-surface p-5 text-small shadow-card">
            {live.error ?? "Can't reach the salon right now."}{' '}
            <button type="button" onClick={() => refreshQueue()} className="min-h-11 font-semibold underline underline-offset-2">
              Try again
            </button>
          </li>
        )}
        {ready && live.barbers.length === 0 && <li className="rounded-card bg-surface p-5 text-small text-muted shadow-card">No barbers on duty today.</li>}
        {ready &&
          live.barbers.map((b, i) => {
            const state = barberNow(b, live.entries, now)
            return (
              <motion.li key={b.id} {...rise} transition={{ ...transition.card, delay: i * stagger.list }}>
                <Link
                  to={`/barber/${b.slug}`}
                  className="flex min-h-24 items-center gap-4 rounded-card bg-surface py-4 pr-4 pl-4 shadow-card transition-transform active:scale-[0.98]"
                >
                  <BarberAvatar name={b.name} color={b.color} shape={b.shape} size={60} progress={state.kind === 'busy' ? state.progress : null} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-title font-extrabold">{b.name}</span>
                    <span className="mt-1 block">
                      <StatusChip state={state} />
                    </span>
                  </span>
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2">
                    <ChevronRight size={20} />
                  </span>
                </Link>
              </motion.li>
            )
          })}
      </ul>
    </main>
  )
}
