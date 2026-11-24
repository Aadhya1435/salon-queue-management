import { ChevronLeft, ChevronRight, Crown, Lock, MonitorPlay, Scissors, Tablet } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import BlobCluster from '../components/BlobCluster'
import { useLiveQueue } from '../lib/liveQueue'
import { lockStaff, useStaffSession } from '../lib/staff'
import { rise, stagger, transition } from '../styles/motion'

const TILES = [
  { to: '/reception', label: 'Reception', note: 'Walk-ins, call next, no-shows', pin: 'Staff PIN', Icon: Tablet },
  { to: '/barber', label: 'Barber', note: 'Start and Done from your phone', pin: 'Staff PIN', Icon: Scissors },
  { to: '/display', label: 'TV display', note: 'Now serving and up next', pin: 'No PIN', Icon: MonitorPlay },
  { to: '/admin', label: 'Owner', note: 'Services, barbers, open/close, stats', pin: 'Owner PIN', Icon: Crown },
]

/** Screen 9: Staff hub (docs/02-screens.md). One place for staff to open their screen. */
export default function StaffHub() {
  const { settings } = useLiveQueue()
  const session = useStaffSession()

  useEffect(() => {
    document.title = 'Staff · Roselle'
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="relative overflow-hidden rounded-b-sheet bg-linear-to-br from-hero to-hero-2 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 text-white sm:mx-5 sm:mt-6 sm:rounded-sheet">
        <BlobCluster className="pointer-events-none absolute top-10 -right-3 w-32" />
        <div className="relative pr-24">
          <Link to="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-small font-semibold text-white/80 hover:text-white">
            <ChevronLeft size={18} aria-hidden="true" /> Home
          </Link>
          <h1 className="mt-2 text-heading font-extrabold tracking-tight">Staff</h1>
          <p className="mt-1 text-small text-white/80">{settings?.salon_name ?? 'Roselle'} · open your screen</p>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-3 px-5 pt-6 min-[420px]:grid-cols-2">
        {TILES.map(({ to, label, note, pin, Icon }, i) => (
          <motion.li key={to} {...rise} transition={{ ...transition.card, delay: i * stagger.list }}>
            <Link
              to={to}
              className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card bg-surface p-5 shadow-card transition-transform active:scale-[0.97]"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-accent-tint text-accent">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <ChevronRight size={20} aria-hidden="true" className="text-muted" />
              </span>
              <span>
                <span className="block text-title font-bold">{label}</span>
                <span className="mt-0.5 block text-small text-muted">{note}</span>
                <span className="mt-2 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-caption font-semibold">{pin}</span>
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      {session && (
        <button
          type="button"
          onClick={lockStaff}
          className="mx-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 text-small font-semibold shadow-card"
        >
          <Lock size={16} aria-hidden="true" /> Signed in as {session.role === 'owner' ? 'Owner' : 'Staff'} · Lock this device
        </button>
      )}

      <footer className="mt-auto flex items-center justify-center gap-1.5 px-5 pt-10 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-caption font-semibold text-muted">
        <img src="/favicon.svg" alt="" className="size-4 rounded" /> Roselle
      </footer>
    </main>
  )
}
