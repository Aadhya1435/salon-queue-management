import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ease } from '../styles/motion'

/** A number that rolls like an odometer when it changes (Motion moments 2 and 8). */
export function Rolling({ value, className = '' }: { value: string | number; className?: string }) {
  return (
    <span className={`num relative inline-grid overflow-hidden align-bottom ${className}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={String(value)}
          className="col-start-1 row-start-1"
          initial={{ y: '90%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-90%', opacity: 0 }}
          transition={{ duration: 0.4, ease: ease.out }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Counts up from 0 on first show, then rolls on later changes (Motion moment 1). */
export function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  const [done, setDone] = useState(Boolean(reduce))
  // Count up once, to the value at first show; later changes roll instead.
  const firstValue = useRef(value)

  useEffect(() => {
    if (done) return
    const controls = animate(0, firstValue.current, {
      duration: 0.7,
      ease: ease.out,
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => setDone(true),
    })
    return () => controls.stop()
  }, [done])

  return done ? <Rolling value={value} className={className} /> : <span className={`num ${className}`}>{shown}</span>
}
