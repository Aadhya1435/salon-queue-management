import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { burst } from '../lib/confetti'
import { formatToken, ordinal } from '../lib/format'
import { waitPhrase } from '../lib/queue/display'
import { ease, rise, transition, vibrate } from '../styles/motion'
import PillButton from './PillButton'

type Props = {
  token: number
  /** From the live forecast; null until the new spot has loaded. */
  place: number | null
  wait: number | null
  onContinue: () => void
}

const AUTO_CONTINUE_MS = 6500
const ARM_AFTER_MS = 1200

/**
 * Motion moment 7: the check pops and draws itself, blob confetti bursts, and
 * the token rolls like a ticket counter before landing. Then My Status opens.
 */
export default function YoureIn({ token, place, wait, onContinue }: Props) {
  const reduce = useReducedMotion()
  const hostRef = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(reduce ? token : Math.max(1, token - 9))
  const [armed, setArmed] = useState(false)

  // Ticket-counter roll.
  useEffect(() => {
    if (reduce) return
    const from = Math.max(1, token - 9)
    const count = Math.min(8, token - from + 1)
    const steps: number[] = []
    for (let i = 0; i < count; i++) steps.push(Math.round(from + ((token - from) * i) / Math.max(1, count - 1)))
    let i = 0
    let tick: ReturnType<typeof setInterval> | undefined
    const begin = setTimeout(() => {
      tick = setInterval(() => {
        i += 1
        setShown(steps[Math.min(i, steps.length - 1)])
        if (i >= steps.length - 1) clearInterval(tick)
      }, 110)
    }, 520)
    return () => {
      clearTimeout(begin)
      clearInterval(tick)
    }
  }, [token, reduce])

  // Confetti from the check mark, a short buzz, then move on.
  useEffect(() => {
    const pop = setTimeout(() => {
      const host = hostRef.current
      const check = checkRef.current
      if (!host || !check) return
      const h = host.getBoundingClientRect()
      const c = check.getBoundingClientRect()
      burst(host, c.left + c.width / 2 - h.left, c.top + c.height / 2 - h.top, 38)
      vibrate(20)
    }, 420)
    const next = setTimeout(onContinue, AUTO_CONTINUE_MS)
    // A second tap on Confirm lands where "See my spot" appears: ignore taps until it's visible.
    const arm = setTimeout(() => setArmed(true), ARM_AFTER_MS)
    return () => {
      clearTimeout(pop)
      clearTimeout(next)
      clearTimeout(arm)
    }
  }, [onContinue])

  const appear = (delay: number) => ({ ...rise, transition: { ...transition.card, delay } })

  return (
    <motion.div
      ref={hostRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="youre-in-title"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-linear-to-b from-hero to-primary px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.fade}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-2 text-center">
        <motion.div
          ref={checkRef}
          className="grid size-24 place-items-center rounded-full bg-white ring-[12px] ring-white/10"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: [0, 1.15, 1], rotate: 0 }}
          transition={{ duration: 0.65, ease: ease.out }}
        >
          <svg viewBox="0 0 24 24" className="size-12" fill="none" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              className="stroke-primary"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.42, delay: 0.38, ease: ease.out }}
            />
          </svg>
        </motion.div>
        <motion.h1 id="youre-in-title" {...appear(0.42)} className="mt-5 text-heading font-extrabold tracking-tight">
          You're in!
        </motion.h1>
        <motion.p {...appear(0.51)} className="text-small text-white/80">
          Your token
        </motion.p>
        <motion.p {...appear(0.6)} className="num text-token font-extrabold tracking-tight" aria-label={`Token ${formatToken(token)}`}>
          {formatToken(shown)}
        </motion.p>
        <motion.p {...appear(0.69)} className="mt-1 text-body text-white/85">
          {place !== null && wait !== null ? `${ordinal(place)} in line · ${waitPhrase(wait, place)}` : 'Saving your spot…'}
        </motion.p>
      </div>
      <motion.div {...appear(0.8)} className={`mx-auto w-full max-w-sm ${armed ? '' : 'pointer-events-none'}`}>
        <PillButton variant="white" onClick={() => armed && onContinue()}>
          See my spot
        </PillButton>
      </motion.div>
    </motion.div>
  )
}
