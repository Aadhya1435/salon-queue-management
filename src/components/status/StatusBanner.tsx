import { AnimatePresence, motion } from 'motion/react'
import { transition } from '../../styles/motion'

type Props = {
  /** null hides the banner. */
  message: string | null
  /** "You're next!" glows twice when it appears (Motion moment 10). */
  glow?: boolean
  tone?: 'accent' | 'muted'
}

/** Opens by animating its height, so the page below slides instead of jumping (Motion moment 9). */
export default function StatusBanner({ message, glow = false, tone = 'accent' }: Props) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="banner"
          role="status"
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 170, damping: 26 }}
        >
          <div className={`relative overflow-hidden rounded-tile px-4 py-3 ${tone === 'accent' ? 'bg-accent-tint' : 'bg-surface-2'}`}>
            {glow && (
              <motion.span
                key={message}
                aria-hidden="true"
                className="absolute inset-0 bg-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.22, 0, 0.22, 0] }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={message}
                className="relative flex items-center gap-2.5 text-small font-semibold text-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.fade}
              >
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-break'}`} />
                {message}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
