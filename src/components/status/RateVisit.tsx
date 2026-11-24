import { Star } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { rateVisit } from '../../lib/api'
import { burst } from '../../lib/confetti'
import { errorCode, friendlyError } from '../../lib/errors'
import { spring, stagger, transition, vibrate, vibration } from '../../styles/motion'
import PillButton from '../PillButton'

type Props = { id: string; barberName: string; rating: number | null; onRated: () => void }

/** Motion moment 12: stars pop in one by one; a tap fills them in order with a small confetti burst. */
export default function RateVisit({ id, barberName, rating, onRated }: Props) {
  const [picked, setPicked] = useState<number | null>(rating)
  const [thanks, setThanks] = useState(rating !== null)
  const [error, setError] = useState<string | null>(null)
  // Stars fill one after another up to the tapped one.
  const [fill, setFill] = useState(rating ?? 0)
  const hostRef = useRef<HTMLDivElement>(null)

  async function pick(stars: number, target: HTMLElement) {
    if (picked !== null) return
    setPicked(stars)
    setError(null)
    for (let n = 1; n <= stars; n++) setTimeout(() => setFill((f) => Math.max(f, n)), (n - 1) * stagger.stars * 1000)
    vibrate(vibration.tap)
    const host = hostRef.current
    if (host) {
      const h = host.getBoundingClientRect()
      const t = target.getBoundingClientRect()
      burst(host, t.left + t.width / 2 - h.left, t.top + t.height / 2 - h.top, 18, 0.6)
    }
    try {
      await rateVisit(id, stars)
      setTimeout(() => setThanks(true), 450)
      onRated()
    } catch (e) {
      if (errorCode(e) === 'cannot_rate') {
        setThanks(true)
        return
      }
      setPicked(null)
      setFill(0)
      setError(friendlyError(e))
    }
  }

  return (
    <div ref={hostRef} className="relative flex flex-col items-center gap-4 text-center">
      <AnimatePresence mode="wait" initial={false}>
        {thanks ? (
          <motion.div key="thanks" className="flex w-full flex-col items-center gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition.card}>
            {picked !== null && (
              <p className="flex gap-1 text-accent" aria-label={`You rated ${picked} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={22} fill={n <= picked ? 'currentColor' : 'none'} strokeWidth={n <= picked ? 0 : 1.8} className={n <= picked ? '' : 'text-surface-2'} />
                ))}
              </p>
            )}
            <p className="text-title font-bold">Thanks! See you next time</p>
            <div className="w-full">
              <PillButton to="/join">Join again</PillButton>
            </div>
          </motion.div>
        ) : (
          <motion.div key="ask" className="flex w-full flex-col items-center gap-3" exit={{ opacity: 0, y: -8 }} transition={transition.fade}>
            <p className="text-body font-semibold">How was your visit with {barberName}?</p>
            <div role="radiogroup" aria-label="Rate your visit" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n, i) => {
                const filled = n <= fill
                return (
                  <motion.button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={picked === n}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onClick={(e) => void pick(n, e.currentTarget)}
                    disabled={picked !== null}
                    className="grid size-14 place-items-center rounded-full text-accent"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: filled ? [1, 1.3, 1] : 1, opacity: 1 }}
                    transition={filled ? { duration: 0.35 } : { ...spring.pop, delay: 0.2 + i * stagger.stars }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Star size={36} strokeWidth={filled ? 0 : 1.8} fill={filled ? 'currentColor' : 'none'} className={filled ? '' : 'text-muted'} />
                  </motion.button>
                )
              })}
            </div>
            {error && <p className="text-small text-danger">{error}</p>}
            <button type="button" onClick={() => setThanks(true)} className="min-h-11 px-4 text-small font-semibold text-muted underline underline-offset-2">
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
