import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { duration, ease, spring, vibrate, vibration } from '../../styles/motion'

type Props = {
  label: string
  /** Gets the button element (e.g. to fire confetti from it). */
  onClick: (el: HTMLButtonElement) => void
  busy?: boolean
  disabled?: boolean
  /** dark = aubergine (default); white = for dark panels. */
  variant?: 'dark' | 'white'
}

/**
 * The Barber View's giant button (docs/02-screens.md → Screen 5, Motion moment 17):
 * the aubergine pill with an arrow bubble, 72 px+ tall, full width. It squashes on
 * press and the label morphs between states (Call next → Start → Done).
 */
export default function BigActionButton({ label, onClick, busy = false, disabled = false, variant = 'dark' }: Props) {
  const dark = variant === 'dark'
  const off = disabled || busy
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        if (off) return
        vibrate(vibration.tap)
        onClick(e.currentTarget)
      }}
      disabled={disabled}
      aria-busy={busy}
      whileTap={off ? undefined : { scale: 0.95, scaleY: 0.9 }}
      transition={spring.pop}
      className={`flex h-20 w-full items-center justify-between gap-3 rounded-full pr-2 pl-7 text-left text-title font-extrabold disabled:cursor-not-allowed disabled:opacity-45 ${
        dark ? 'bg-primary text-on-primary shadow-pop' : 'bg-surface text-text shadow-pop'
      }`}
    >
      <span className="relative grid min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className="col-start-1 row-start-1 truncate"
            initial={{ y: '60%', opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-60%', opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: duration.base, ease: ease.out }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
      <span aria-hidden="true" className={`grid size-16 shrink-0 place-items-center rounded-full ${dark ? 'bg-white/15' : 'bg-surface-2'}`}>
        {busy ? (
          <span className="size-7 animate-spin rounded-full border-[3px] border-current border-t-transparent opacity-80" />
        ) : (
          <ChevronRight size={28} strokeWidth={2.6} />
        )}
      </span>
    </motion.button>
  )
}
