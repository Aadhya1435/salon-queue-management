import { Star } from 'lucide-react'
import { motion } from 'motion/react'
import { PUFF_STAR } from '../lib/shapes'
import type { BarberShape } from '../lib/types'
import { ease } from '../styles/motion'

type Props = {
  name: string
  /** The barber's signature colour (from the database). */
  color: string
  shape: BarberShape
  size?: number
  /** 0–1: how much of the current service is done. Draws a thin ring when set. */
  progress?: number | null
}

/** A barber's signature shape with their initial: docs/02-screens.md → Engaging touches. */
export function BarberAvatar({ name, color, shape, size = 32, progress = null }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0 overflow-visible">
      {progress !== null && (
        <>
          <circle cx="20" cy="20" r="18.6" fill="none" strokeWidth="2.4" className="stroke-border" />
          <motion.circle
            cx="20"
            cy="20"
            r="18.6"
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress }}
            transition={{ duration: 1, ease: ease.out, delay: 0.35 }}
          />
        </>
      )}
      <Shape shape={shape} color={color} />
      <text x="20" y="24.4" textAnchor="middle" fontSize="12" fontWeight="800" className="fill-white" style={{ fontFamily: 'inherit' }}>
        {name.trim().charAt(0).toUpperCase()}
      </text>
    </svg>
  )
}

function Shape({ shape, color }: { shape: BarberShape; color: string }) {
  switch (shape) {
    case 'star':
      return <path d={PUFF_STAR} transform="translate(20 20) scale(15.5)" fill={color} />
    case 'clover':
      return (
        <g transform="translate(20 20) scale(12.5)" fill={color}>
          <circle cy="-0.5" r="0.6" />
          <circle cx="0.5" r="0.6" />
          <circle cy="0.5" r="0.6" />
          <circle cx="-0.5" r="0.6" />
          <circle r="0.6" />
        </g>
      )
    case 'pill':
      return <rect x="5" y="11" width="30" height="18" rx="9" fill={color} />
    default:
      return <circle cx="20" cy="20" r="14.5" fill={color} />
  }
}

/** "Any barber": a ★ on aubergine. */
export function AnyAvatar({ size = 32 }: { size?: number }) {
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-full bg-primary text-on-primary" style={{ width: size * 0.8, height: size * 0.8, margin: size * 0.1 }}>
      <Star size={size * 0.38} fill="currentColor" strokeWidth={0} />
    </span>
  )
}
