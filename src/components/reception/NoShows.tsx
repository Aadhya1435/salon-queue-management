import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { formatClock, formatToken } from '../../lib/format'
import type { StaffQueueEntry } from '../../lib/types'
import { transition } from '../../styles/motion'
import { Spinner } from './BarberCard'
import { displayName } from './format'

type Props = {
  rows: StaffQueueEntry[]
  busyId: string | null
  onReadd: (entry: StaffQueueEntry) => void
}

/** "No-shows today (n)": collapsible, with [Re-add] (docs/03-flows-rules.md §7). */
export default function NoShows({ rows, busyId, onReadd }: Props) {
  const [open, setOpen] = useState(false)
  const noShows = rows.filter((e) => e.status === 'no_show').sort((a, b) => Date.parse(a.called_at ?? a.joined_at) - Date.parse(b.called_at ?? b.joined_at))
  const readdedAs = new Map(rows.filter((e) => e.readded_from).map((e) => [e.readded_from!, e.token]))

  return (
    <section className="rounded-card bg-surface shadow-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="no-shows-list"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left text-body font-bold"
      >
        <span>
          No-shows today <span className="num text-muted">({noShows.length})</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={transition.fade}>
          <ChevronDown size={20} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="no-shows-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.fade}
            className="overflow-hidden"
          >
            {noShows.length === 0 ? (
              <p className="px-5 pb-5 text-small text-muted">No no-shows today.</p>
            ) : (
              <ul className="flex flex-col border-t border-border">
                {noShows.map((e) => {
                  const again = readdedAs.get(e.id)
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-2.5 last:border-b-0">
                      <span className="num w-14 text-body font-extrabold text-muted">{formatToken(e.token)}</span>
                      <span className="min-w-0 flex-1 truncate text-small font-semibold">{displayName(e)}</span>
                      <span className="num text-caption text-muted">Called {e.called_at ? formatClock(new Date(e.called_at)) : '—'}</span>
                      {again !== undefined ? (
                        <span className="num min-h-11 content-center text-caption font-semibold text-success">Re-added as {formatToken(again)}</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => onReadd(e)}
                          className="flex min-h-11 min-w-22 items-center justify-center rounded-full bg-surface-2 px-4 text-small font-semibold text-text disabled:opacity-50"
                        >
                          {busyId === e.id ? <Spinner /> : 'Re-add'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
