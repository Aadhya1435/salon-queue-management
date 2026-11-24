import { useState } from 'react'
import BlobCluster from '../BlobCluster'
import { ownerSetOnline } from '../../lib/api'
import { formatTimeOfDay } from '../../lib/format'
import { refreshQueue } from '../../lib/liveQueue'
import { ONLINE_CLOSES_BEFORE_CLOSING } from '../../lib/queue/joinWindow'
import { timeToMinutes } from '../../lib/time'
import type { Settings } from '../../lib/types'
import { Switch } from './ui'
import { ownerError } from './ownerError'

function minutesToTime(total: number): string {
  const m = Math.max(0, total)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** "Online joining closes at" = closing − 30 min. */
function onlineClosesAt(settings: Pick<Settings, 'close_time'>): string {
  return formatTimeOfDay(minutesToTime(timeToMinutes(settings.close_time) - ONLINE_CLOSES_BEFORE_CLOSING))
}

/** The big Open / Closed toggle for online joining (always at the top of /admin). */
export default function QueueSwitchCard({ pin, settings }: { pin: string; settings: Settings | null }) {
  const [pending, setPending] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const open = pending ?? settings?.online_open ?? false

  async function toggle(next: boolean) {
    setPending(next)
    setError(null)
    try {
      await ownerSetOnline(pin, next)
      await refreshQueue()
    } catch (e) {
      setError(ownerError(e))
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      aria-labelledby="queue-switch-title"
      className="relative overflow-hidden rounded-card bg-linear-to-br from-hero to-hero-2 p-5 text-white shadow-pop"
    >
      <BlobCluster className="pointer-events-none absolute top-2 right-3 w-12 opacity-90 sm:top-1/2 sm:right-28 sm:-translate-y-1/2" />
      <div className="relative flex items-center gap-4 pr-16 sm:pr-24">
        <div className="min-w-0 flex-1">
          <h2 id="queue-switch-title" className="text-caption font-semibold tracking-wide text-white/75 uppercase">
            Online queue
          </h2>
          <p className="mt-0.5 text-heading font-extrabold">{settings ? (open ? 'Open' : 'Closed') : '…'}</p>
          <p className="mt-1 text-small text-white/85" aria-live="polite">
            {!settings
              ? 'Loading…'
              : open
                ? `Online joining is open until ${onlineClosesAt(settings)}`
                : 'Online joining is closed — walk-ins only'}
          </p>
          {error && (
            <p role="alert" className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-caption font-semibold text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="absolute right-5 bottom-5">
        <Switch size="lg" checked={open} disabled={!settings || pending !== null} onChange={toggle} label="Online joining" />
      </div>
    </section>
  )
}
