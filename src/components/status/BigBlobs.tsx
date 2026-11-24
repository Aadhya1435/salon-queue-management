import { motion } from 'motion/react'
import { useId } from 'react'
import { PUFF_STAR, STAR } from '../../lib/shapes'
import { spring } from '../../styles/motion'

/** The fuller blob cluster (6–8 shapes) for "It's your turn": shapes burst in, then drift. */
export default function BigBlobs({ className = '' }: { className?: string }) {
  const gradientId = 'orchid-big-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fill = `url(#${gradientId})`

  const shapes = [
    <circle key="a" cx="40" cy="40" r="22" className="fill-white/90" />,
    <path key="b" d={STAR} transform="translate(300 60) scale(42)" fill={fill} />,
    <rect key="c" x="250" y="300" width="96" height="40" rx="20" transform="rotate(-18 298 320)" className="fill-blob-mint" />,
    <circle key="d" cx="330" cy="200" r="14" className="fill-blob-sky" />,
    <path key="e" d={PUFF_STAR} transform="translate(60 300) scale(34)" className="fill-blob-plum" />,
    <circle key="f" cx="180" cy="22" r="9" className="fill-blob-orchid" />,
    <rect key="g" x="10" y="170" width="56" height="24" rx="12" transform="rotate(24 38 182)" className="fill-blob-orchid-2" />,
    <circle key="h" cx="200" cy="360" r="11" className="fill-white/70" />,
  ]

  return (
    <svg viewBox="0 0 360 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={`overflow-visible ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--color-blob-orchid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-blob-orchid-2)' }} />
        </linearGradient>
      </defs>
      {shapes.map((shape, i) => (
        <motion.g
          key={i}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.pop, delay: 0.35 + i * 0.06 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <g className="origin-center animate-drift [transform-box:fill-box]" style={{ animationDelay: `${-i * 0.9}s`, animationDuration: `${6 + (i % 3) * 0.5}s` }}>
            {shape}
          </g>
        </motion.g>
      ))}
    </svg>
  )
}
