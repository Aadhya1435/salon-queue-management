import { motion } from 'motion/react'
import { spring, transition } from '../../styles/motion'

const STEPS = ['Joined', 'Coming', 'Your turn', 'In chair', 'Done'] as const

/** Five dots on a thin track. Finished steps are aubergine; the current one glows orchid. */
export default function JourneyTracker({ step }: { step: number }) {
  return (
    <ol aria-label="Your visit" className="relative grid grid-cols-5">
      {/* Track sits behind the dots, from the first dot's centre to the last one's. */}
      <span aria-hidden="true" className="absolute top-[7px] right-[10%] left-[10%] h-0.5 rounded-full bg-surface-2" />
      <motion.span
        aria-hidden="true"
        className="absolute top-[7px] left-[10%] h-0.5 origin-left rounded-full bg-primary"
        style={{ width: '80%' }}
        initial={false}
        animate={{ scaleX: step / (STEPS.length - 1) }}
        transition={transition.card}
      />
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        return (
          <li key={label} className="relative flex flex-col items-center gap-1.5" aria-current={current ? 'step' : undefined}>
            <span className="relative grid size-4 place-items-center">
              {current && <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" />}
              <motion.span
                aria-hidden="true"
                className={`relative size-4 rounded-full border-2 ${current ? 'border-accent bg-accent' : done ? 'border-primary bg-primary' : 'border-surface-2 bg-surface'}`}
                initial={false}
                animate={{ scale: current ? 1.15 : 1 }}
                transition={spring.pop}
              />
            </span>
            <span className={`text-center text-caption leading-tight ${current ? 'font-bold text-text' : done ? 'font-semibold text-text' : 'text-muted'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
