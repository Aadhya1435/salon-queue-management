import { Clock, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { formatToken } from '../../lib/format'
import { waitPhrase } from '../../lib/queue/display'
import type { Forecast } from '../../lib/queue/estimate'
import type { Barber, StaffQueueEntry } from '../../lib/types'
import { spring } from '../../styles/motion'
import { ColorDot, ServiceChips } from './Chips'
import { capitalise, displayName, minutesSince } from './format'

const LONG_WAIT_MIN = 60
const FLASH = { duration: 0.6 }

// Tablet: one grid row per customer. Phone: each row is a card.
const COLS = 'md:grid md:grid-cols-[2.5rem_4rem_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1fr)_4.5rem_8rem_6rem] md:items-center md:gap-3'

type Props = {
  waiting: StaffQueueEntry[]
  barbers: Barber[]
  forecast: Forecast
  now: number
  onCancel: (entry: StaffQueueEntry) => void
}

/** The waiting list in queue order (docs/02-screens.md → Screen 4, item 3). */
export default function WaitingList({ waiting, barbers, forecast, now, onCancel }: Props) {
  // Rows present on first show don't flash; later arrivals do (Motion moment 15).
  const [firstShow] = useState(() => new Set(waiting.map((e) => e.id)))

  const barberById = new Map(barbers.map((b) => [b.id, b]))

  return (
    <section aria-labelledby="waiting-title" className="flex flex-col gap-3">
      <h2 id="waiting-title" className="flex items-center gap-2 text-body font-bold">
        Waiting
        <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-caption font-bold text-on-accent">{waiting.length}</span>
      </h2>

      <div role="table" aria-labelledby="waiting-title" className="md:overflow-hidden md:rounded-card md:bg-surface md:shadow-card">
        <div role="row" className={`hidden border-b border-border px-4 py-2.5 text-caption font-semibold text-muted ${COLS}`}>
          {['#', 'Token', 'Name', 'Services', 'Wants', 'Waiting', 'Est. wait', ''].map((h, i) => (
            <span key={i} role="columnheader">
              {h}
            </span>
          ))}
        </div>

        {waiting.length === 0 && (
          <p className="rounded-card bg-surface p-6 text-center text-small text-muted shadow-card md:rounded-none md:shadow-none">No one waiting — walk right in!</p>
        )}

        <ul className="flex flex-col gap-2.5 md:gap-0">
          <AnimatePresence initial={false}>
            {waiting.map((e, i) => {
              const est = forecast.byEntry.get(e.id)
              const waited = minutesSince(e.joined_at, now)
              const long = waited > LONG_WAIT_MIN
              const wants = e.barber_pref ? barberById.get(e.barber_pref) : null
              const estText =
                est?.wait == null
                  ? wants
                    ? `${wants.name} on break`
                    : '—'
                  : capitalise(waitPhrase(est.wait, est.place))
              return (
                <motion.li
                  key={e.id}
                  role="row"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                  transition={spring.soft}
                  className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 overflow-hidden rounded-card bg-surface p-4 shadow-card md:rounded-none md:border-b md:border-border md:px-4 md:py-3 md:shadow-none md:last:border-b-0 ${COLS}`}
                >
                  {/* Long-wait tint fades in once and stays (Motion moment 16). */}
                  {long && (
                    <motion.span aria-hidden="true" className="absolute inset-0 bg-warning-tint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FLASH} />
                  )}
                  {/* New arrival flashes accent-tint once (Motion moment 15). */}
                  {!firstShow.has(e.id) && (
                    <motion.span aria-hidden="true" className="absolute inset-0 bg-accent-tint" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={FLASH} />
                  )}

                  <span role="cell" className="num relative hidden text-small font-semibold text-muted md:block">
                    {i + 1}
                  </span>
                  <span role="cell" className="relative">
                    <motion.span layoutId={`token-${e.id}`} transition={spring.soft} className="num inline-block text-body font-extrabold text-accent">
                      {formatToken(e.token)}
                    </motion.span>
                  </span>
                  <span role="cell" className="relative min-w-0 truncate text-small font-semibold">
                    <span className="num mr-1.5 text-muted md:hidden">{i + 1}.</span>
                    {displayName(e)}
                    {e.source === 'walk_in' && <span className="ml-1.5 text-caption font-medium text-muted">walk-in</span>}
                  </span>
                  <span role="cell" className="relative col-span-3 md:col-span-1">
                    <ServiceChips services={e.services} small />
                  </span>
                  <span role="cell" className="relative col-span-3 flex min-w-0 items-center gap-1.5 text-small md:col-span-1">
                    {wants ? (
                      <>
                        <ColorDot color={wants.color} />
                        <span className="truncate">{wants.name}</span>
                      </>
                    ) : (
                      <span className="text-muted">Any</span>
                    )}
                  </span>
                  <span
                    role="cell"
                    className={`num relative row-start-1 col-start-3 flex items-center gap-1 justify-self-end text-small font-semibold md:col-start-auto md:row-start-auto md:justify-self-start ${long ? 'text-warning' : 'text-muted'}`}
                  >
                    {long && <Clock size={14} aria-hidden="true" />}
                    {waited} min
                  </span>
                  <span role="cell" className="num relative col-span-2 text-small font-semibold md:col-span-1">
                    <span className="mr-1 font-medium text-muted md:hidden">Turn in</span>
                    {estText}
                  </span>
                  <span role="cell" className="relative justify-self-end">
                    <button
                      type="button"
                      onClick={() => onCancel(e)}
                      className="flex min-h-11 items-center gap-1 rounded-full px-3 text-small font-semibold text-danger hover:bg-surface-2"
                    >
                      <X size={16} aria-hidden="true" /> Cancel
                    </button>
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}
