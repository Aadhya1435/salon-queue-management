import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useEffect, type RefObject } from 'react'
import { formatToken } from '../../lib/format'
import type { Barber } from '../../lib/types'
import { spring, transition, vibrate, vibration } from '../../styles/motion'
import { AnyAvatar, BarberAvatar } from '../BarberAvatar'
import LiveDot from '../LiveDot'
import BigBlobs from './BigBlobs'
import { playChime } from './chime'

type Props = {
  token: number
  barber: Barber | null
  /** Where the circle grows from (the token card's centre), in viewport pixels. */
  originRef: RefObject<{ x: number; y: number } | null>
  live: boolean
}

/** Motion moment 11: a plum circle grows out of the token card and fills the screen. */
export default function CalledTakeover({ token, barber, originRef, live }: Props) {
  const reduce = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const barberName = barber?.name ?? 'your stylist'

  useEffect(() => {
    // Browsers refuse (and log) vibration before the first tap on the page.
    if (navigator.userActivation?.hasBeenActive ?? true) vibrate(vibration.yourTurn)
    playChime()
  }, [])

  useEffect(() => {
    const el = scope.current
    if (!el || reduce) return
    const origin = originRef.current
    const x = origin ? `${Math.round(origin.x)}px` : '50%'
    const y = origin ? `${Math.round(origin.y)}px` : '40%'
    const controls = animate(el, { clipPath: [`circle(0% at ${x} ${y})`, `circle(150% at ${x} ${y})`] }, transition.reveal)
    return () => controls.stop()
  }, [animate, scope, originRef, reduce])

  const words = "It's your turn!".split(' ')
  const appear = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { ...transition.card, delay } })

  return (
    <div
      ref={scope}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="your-turn-title"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-linear-to-b from-hero to-primary px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
    >
      <BigBlobs className="pointer-events-none absolute inset-0 size-full opacity-90" />
      <div className="relative flex justify-end">
        <LiveDot live={live} onDark />
      </div>
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-3 text-center">
        <motion.div className="relative grid size-32 place-items-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.pop, delay: 0.3 }}>
          <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" />
          <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-white/25 [animation-delay:1.2s]" />
          <span className="relative grid size-28 place-items-center rounded-full bg-white shadow-pop">
            {barber ? <BarberAvatar name={barber.name} color={barber.color} shape={barber.shape} size={88} /> : <AnyAvatar size={88} />}
          </span>
        </motion.div>
        <h1 id="your-turn-title" className="mt-4 text-heading font-extrabold tracking-tight">
          {words.map((word, i) => (
            <motion.span key={i} className="inline-block" {...appear(0.45 + i * 0.09)}>
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>
        <motion.p {...appear(0.8)} className="text-title">
          Go to <strong className="font-extrabold">{barberName}</strong>
        </motion.p>
        <motion.p {...appear(0.9)} className="num mt-3 rounded-full bg-accent px-7 py-2.5 text-big font-extrabold tracking-tight text-on-accent shadow-pop" aria-label={`Token ${formatToken(token)}`}>
          {formatToken(token)}
        </motion.p>
        <motion.p {...appear(1)} className="mt-2 text-small text-white/85">
          Show this screen at the desk
        </motion.p>
      </div>
    </div>
  )
}
