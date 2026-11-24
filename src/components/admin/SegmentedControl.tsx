import { motion } from 'motion/react'
import { spring } from '../../styles/motion'

/** Pill track with an aubergine thumb that slides between options (Motion layoutId). */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  id = 'seg',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  id?: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-full bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`relative h-11 flex-1 rounded-full text-small font-bold transition-colors ${active ? 'text-on-primary' : 'text-muted hover:text-text'}`}
          >
            {active && <motion.span layoutId={`${id}-thumb`} transition={spring.soft} className="absolute inset-0 rounded-full bg-primary shadow-card" />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
