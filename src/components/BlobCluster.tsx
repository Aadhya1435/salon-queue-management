import { motion } from 'motion/react'
import { useId } from 'react'
import { STAR } from '../lib/shapes'
import { spring } from '../styles/motion'

/**
 * The small corner cluster (3–4 shapes) from docs/02-screens.md → Blob cluster.
 * Shapes pop in one by one, then drift slowly (still under reduce motion).
 */
export default function BlobCluster({ className = '' }: { className?: string }) {
  const gradientId = 'orchid-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')

  const shapes = [
    <circle key="circle" cx="26" cy="22" r="12" className="fill-white" />,
    <path key="star" d={STAR} transform="translate(74 42) scale(30)" fill={`url(#${gradientId})`} />,
    <rect key="pill" x="58" y="74" width="56" height="26" rx="13" transform="rotate(-14 86 87)" className="fill-blob-mint" />,
    <circle key="dot" cx="112" cy="8" r="10" className="fill-blob-plum" />,
  ]

  return (
    <svg viewBox="0 0 120 105" aria-hidden="true" className={`overflow-visible ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--color-blob-orchid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-blob-orchid-2)' }} />
        </linearGradient>
      </defs>
      {shapes.map((shape, i) => (
        <motion.g
          key={i}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.pop, delay: 0.16 + i * 0.09 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g className="origin-center animate-drift [transform-box:fill-box]" style={{ animationDelay: `${-i * 1.5}s` }}>
            {shape}
          </g>
        </motion.g>
      ))}
    </svg>
  )
}
