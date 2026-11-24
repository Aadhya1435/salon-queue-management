import { motion } from 'motion/react'
import { BarberAvatar } from '../BarberAvatar'
import { formatToken } from '../../lib/format'
import { barberNow } from '../../lib/queue/estimate'
import type { Barber, StaffQueueEntry } from '../../lib/types'
import { spring, transition } from '../../styles/motion'
import { ServiceChips } from './Chips'
import { displayName, mmss } from './format'

/** No-show unlocks 10 min after Called (docs/03-flows-rules.md §7; the database checks again). */
const NO_SHOW_AFTER_S = 600

export type BarberAction = 'call' | 'start' | 'done' | 'no_show' | 'break' | 'available'

type Props = {
  barber: Barber
  rows: StaffQueueEntry[]
  now: number
  busy: BarberAction | null
  onAction: (action: BarberAction, entry: StaffQueueEntry | null) => void
}

/** One barber column on the reception dashboard (docs/02-screens.md → Screen 4). */
export default function BarberCard({ barber, rows, now, busy, onAction }: Props) {
  const current = rows.find((e) => e.assigned_barber === barber.id && (e.status === 'called' || e.status === 'in_chair')) ?? null
  const state = barberNow(barber, rows, now)
  const waitingForMe = rows.some((e) => e.status === 'waiting' && (e.barber_pref === null || e.barber_pref === barber.id))

  const secondsSinceCalled = current?.called_at ? (now - Date.parse(current.called_at)) / 1000 : 0
  const noShowIn = NO_SHOW_AFTER_S - secondsSinceCalled

  let chip = <span className="rounded-full bg-success-tint px-2.5 py-1 text-caption font-semibold text-success">Free</span>
  if (barber.on_break) chip = <span className="rounded-full bg-surface-2 px-2.5 py-1 text-caption font-semibold text-muted">On break</span>
  else if (current?.status === 'called') chip = <span className="rounded-full bg-accent-tint px-2.5 py-1 text-caption font-semibold text-accent">Called</span>
  else if (current?.status === 'in_chair') chip = <span className="rounded-full bg-surface-2 px-2.5 py-1 text-caption font-semibold text-text">In chair</span>

  // Main action, by state.
  let main: { label: string; action: BarberAction; disabled: boolean }
  if (current?.status === 'called') main = { label: 'Start', action: 'start', disabled: false }
  else if (current?.status === 'in_chair') main = { label: 'Done', action: 'done', disabled: false }
  else if (barber.on_break) main = { label: `${barber.name} is on break`, action: 'call', disabled: true }
  else if (!waitingForMe) main = { label: `No one waiting for ${barber.name}`, action: 'call', disabled: true }
  else main = { label: 'Call next', action: 'call', disabled: false }

  return (
    <motion.article
      layout
      transition={spring.soft}
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-card bg-surface shadow-card ${barber.on_break ? 'opacity-80' : ''}`}
      aria-label={barber.name}
    >
      <span aria-hidden="true" className="h-1.5 w-full" style={{ backgroundColor: barber.color }} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-center gap-2.5">
          <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={40} progress={state.kind === 'busy' ? state.progress : null} />
          <h3 className="min-w-0 flex-1 truncate text-body font-bold">{barber.name}</h3>
          {chip}
        </header>

        {/* Current customer */}
        <div className="flex min-h-26 flex-col justify-center gap-1.5 rounded-tile bg-bg p-3">
          {current ? (
            <>
              <div className="flex items-baseline gap-2">
                <motion.span layoutId={`token-${current.id}`} transition={spring.soft} className="num text-title font-extrabold text-accent">
                  {formatToken(current.token)}
                </motion.span>
                <span className="min-w-0 truncate text-body font-semibold">{displayName(current)}</span>
              </div>
              <ServiceChips services={current.services} small />
              {current.status === 'called' ? (
                <p className="num text-caption font-semibold text-muted">Called · {mmss(secondsSinceCalled)} ago</p>
              ) : (
                state.kind === 'busy' && (
                  <div className="flex flex-col gap-1">
                    <p className="num text-caption font-semibold text-muted">In chair · {state.minutesLeft} min left</p>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-label="Service progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(state.progress * 100)}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barber.color }}
                        initial={false}
                        animate={{ width: `${state.progress * 100}%` }}
                        transition={transition.card}
                      />
                    </div>
                  </div>
                )
              )}
            </>
          ) : (
            <p className="text-small text-muted">{barber.on_break ? 'Taking a break' : 'Chair is free'}</p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <motion.button
            type="button"
            whileTap={main.disabled ? undefined : { scale: 0.97 }}
            disabled={main.disabled || busy !== null}
            onClick={() => onAction(main.action, current)}
            className={`flex min-h-12 items-center justify-center rounded-full px-4 text-small font-bold transition-opacity disabled:cursor-not-allowed ${
              main.disabled ? 'bg-surface-2 text-muted' : 'bg-primary text-on-primary shadow-pop disabled:opacity-60'
            }`}
          >
            {busy === main.action ? <Spinner /> : <span className="truncate">{main.label}</span>}
          </motion.button>

          {current?.status === 'called' && (
            <button
              type="button"
              disabled={noShowIn > 0 || busy !== null}
              onClick={() => onAction('no_show', current)}
              className="num flex min-h-11 items-center justify-center rounded-full border-2 border-border px-4 text-small font-semibold text-danger disabled:cursor-not-allowed disabled:text-muted"
            >
              {busy === 'no_show' ? <Spinner /> : noShowIn > 0 ? `No-show in ${mmss(noShowIn)}` : 'No-show'}
            </button>
          )}

          <BreakSwitch
            onBreak={barber.on_break}
            lockedBy={current ? formatToken(current.token) : null}
            busy={busy === 'break' || busy === 'available'}
            disabled={busy !== null}
            onToggle={() => onAction(barber.on_break ? 'available' : 'break', null)}
          />
        </div>
      </div>
    </motion.article>
  )
}

function BreakSwitch({
  onBreak,
  lockedBy,
  busy,
  disabled,
  onToggle,
}: {
  onBreak: boolean
  lockedBy: string | null
  busy: boolean
  disabled: boolean
  onToggle: () => void
}) {
  // Break can't start while someone is Called or In chair (§6). Coming back is always allowed.
  const locked = !onBreak && lockedBy !== null
  return (
    <div className="flex min-h-11 items-center justify-between gap-2">
      <span className="min-w-0 truncate text-caption font-semibold text-muted">{locked ? `Finish with ${lockedBy} first` : onBreak ? 'On break' : 'Available'}</span>
      <button
        type="button"
        role="switch"
        aria-checked={!onBreak}
        aria-label={onBreak ? 'On break. Switch to available' : 'Available. Switch to on break'}
        disabled={locked || disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${onBreak ? 'bg-break' : 'bg-success'} ${busy ? 'animate-pulse' : ''}`}
      >
        <motion.span
          aria-hidden="true"
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow-card"
          initial={false}
          animate={{ x: onBreak ? 0 : 20 }}
          transition={spring.pop}
        />
      </button>
    </div>
  )
}

export function Spinner() {
  return <span aria-label="Working" className="size-5 animate-spin rounded-full border-[2.5px] border-current border-t-transparent opacity-80" />
}
