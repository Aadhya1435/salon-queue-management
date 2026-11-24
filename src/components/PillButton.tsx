import { Check, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { spring } from '../styles/motion'

type Common = {
  children: ReactNode
  /** dark = aubergine (default); white = for dark panels. */
  variant?: 'dark' | 'white'
  /** The arrow bubble becomes a spinner, then a check. */
  state?: 'idle' | 'loading' | 'done'
  className?: string
}
type AsButton = Common & { to?: undefined; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }
type AsLink = Common & { to: string }

const MotionLink = motion.create(Link)

/** Signature component #1: pill button with an arrow bubble (docs/02-screens.md). */
export default function PillButton(props: AsButton | AsLink) {
  const { children, variant = 'dark', state = 'idle', className = '' } = props
  const dark = variant === 'dark'
  const classes = `group flex h-14 w-full items-center justify-between gap-3 rounded-full pl-6 pr-1.5 text-left text-body font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-45 ${
    dark ? 'bg-primary text-on-primary shadow-pop' : 'bg-surface text-text'
  } ${className}`

  const content = (
    <>
      <span className="min-w-0 truncate">{children}</span>
      <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full ${dark ? 'bg-white/15' : 'bg-surface-2'}`}>
        <AnimatePresence mode="wait" initial={false}>
          {state === 'loading' ? (
            <motion.span
              key="loading"
              className="size-6 animate-spin rounded-full border-[2.5px] border-current border-t-transparent opacity-80"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 0.5, opacity: 0 }}
            />
          ) : state === 'done' ? (
            <motion.span key="done" initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={spring.pop}>
              <Check size={22} strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ x: -4, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 6, opacity: 0 }} className="transition-transform group-hover:translate-x-0.5">
              <ChevronRight size={22} strokeWidth={2.6} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </>
  )

  if (props.to !== undefined) {
    return (
      <MotionLink to={props.to} className={classes} whileTap={{ scale: 0.97 }}>
        {content}
      </MotionLink>
    )
  }
  return (
    <motion.button
      type={props.type ?? 'button'}
      onClick={state === 'idle' ? props.onClick : undefined}
      disabled={props.disabled}
      aria-busy={state === 'loading'}
      className={classes}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
    >
      {content}
    </motion.button>
  )
}
