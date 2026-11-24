import { ChevronLeft, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { DemoTools, PinSettings, PosterLink } from '../components/admin/OwnerTools'
import BarbersSettings from '../components/admin/BarbersSettings'
import QueueSwitchCard from '../components/admin/QueueSwitchCard'
import SalonSettings from '../components/admin/SalonSettings'
import SegmentedControl from '../components/admin/SegmentedControl'
import ServicesSettings from '../components/admin/ServicesSettings'
import { StatCards, StatCharts } from '../components/admin/StatsPanel'
import { useOwnerStats } from '../components/admin/useOwnerStats'
import LiveDot from '../components/LiveDot'
import PinGate from '../components/PinGate'
import { useLiveQueue } from '../lib/liveQueue'
import { lockStaff, useStaffSession } from '../lib/staff'
import { rise, transition } from '../styles/motion'

type Tab = 'today' | 'settings'

/** Screen 7: Owner Settings & Stats (docs/02-screens.md). */
export default function Admin() {
  return (
    <PinGate need="owner">
      <OwnerScreen />
    </PinGate>
  )
}

function OwnerScreen() {
  const session = useStaffSession()
  const live = useLiveQueue()
  const [tab, setTab] = useState<Tab>('today')
  const pin = session?.pin ?? ''
  const { stats, error: statsError } = useOwnerStats(pin, live.version)
  const { settings } = live

  useEffect(() => {
    document.title = settings ? `Owner · ${settings.salon_name}` : 'Owner'
  }, [settings])

  // On phones one tab shows at a time; on desktop (lg) both sections sit side by side.
  const show = (t: Tab) => (tab === t ? '' : 'hidden lg:flex')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-6">
      <header className="flex items-center gap-2">
        <Link to="/staff" aria-label="Back to staff screens" className="-ml-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
          <ChevronLeft size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title font-bold">Owner</h1>
          <p className="flex items-center gap-2 truncate text-caption text-muted">
            <span className="truncate">{settings?.salon_name ?? '…'}</span>
            <LiveDot live={live.live} />
          </p>
        </div>
        <button
          type="button"
          onClick={lockStaff}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-small font-semibold text-text shadow-card"
        >
          <Lock size={16} aria-hidden="true" /> Lock
        </button>
      </header>

      <motion.div {...rise} transition={transition.card}>
        <QueueSwitchCard pin={pin} settings={settings} />
      </motion.div>

      <div className="lg:hidden">
        <SegmentedControl
          id="admin-tab"
          label="Owner sections"
          options={[
            { value: 'today', label: 'Today' },
            { value: 'settings', label: 'Settings' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className={`flex-col gap-4 ${show('today') || 'flex'}`}>
        <h2 className="hidden text-title font-bold lg:block">Today</h2>
        {statsError && (
          <p role="alert" className="rounded-tile bg-surface p-4 text-small font-semibold text-danger shadow-card">
            {statsError}
          </p>
        )}
        <StatCards stats={stats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className={`min-w-0 flex-col gap-4 ${show('today') || 'flex'}`}>
          <StatCharts stats={stats} settings={settings} barbers={live.barbers} />
        </div>

        <div className={`min-w-0 flex-col gap-4 ${show('settings') || 'flex'}`}>
          <h2 className="hidden text-title font-bold lg:block">Settings</h2>
          {settings ? (
            <SalonSettings key={settings.id} pin={pin} settings={settings} />
          ) : (
            <div aria-hidden="true" className="h-64 animate-pulse rounded-card bg-surface-2" />
          )}
          <BarbersSettings pin={pin} version={live.version} />
          <ServicesSettings pin={pin} version={live.version} />
          <PosterLink />
          <PinSettings pin={pin} />
          <DemoTools pin={pin} />
        </div>
      </div>
    </main>
  )
}
