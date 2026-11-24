import { motion } from 'motion/react'
import { Rolling } from '../Numbers'
import { roundUpTo5 } from '../../lib/queue/display'
import { transition } from '../../styles/motion'

type Props = {
  /** Minutes left, or null when it can't be estimated (barber on break). */
  wait: number | null
  /** 0–1 of the ring still to go. */
  fraction: number
  place: number
}

const SIZE = 116

/** The orchid countdown ring: eases to new values and counts down by itself (Motion moment 8). */
export default function WaitRing({ wait, fraction, place }: Props) {
  const centre =
    wait === null ? { big: '–', small: 'paused' } : wait <= 0 && place <= 1 ? { big: 'Now', small: 'any moment' } : wait < 5 ? { big: '<5', small: 'min' } : { big: roundUpTo5(wait), small: 'min' }

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox="0 0 100 100" width={SIZE} height={SIZE} aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r="43" fill="none" strokeWidth="9" className="stroke-surface-2" />
        {wait !== null && (
          <motion.circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-accent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(0.02, Math.min(1, fraction)) }}
            transition={{ ...transition.card, duration: 0.9 }}
          />
        )}
      </svg>
      <p className="relative flex flex-col items-center leading-none">
        <Rolling value={centre.big} className="text-heading font-extrabold tracking-tight" />
        <span className="mt-1 text-caption font-semibold text-muted">{centre.small}</span>
      </p>
    </div>
  )
}
