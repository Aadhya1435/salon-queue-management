/**
 * Motion tokens: docs/02-screens.md → Motion & delight.
 * Use these with Motion (`motion/react`) instead of ad-hoc numbers.
 * Durations are in seconds (Motion's unit).
 */
import type { Transition } from 'motion/react'

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  celebrate: 0.9,
} as const

export const ease = {
  out: [0.2, 0.8, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const

export const spring = {
  /** Taps, badges, check marks: a small overshoot. */
  pop: { type: 'spring', stiffness: 500, damping: 22 },
  /** Layout shifts and sliding selection rings. */
  soft: { type: 'spring', stiffness: 170, damping: 26 },
} as const satisfies Record<string, Transition>

export const transition = {
  fade: { duration: duration.base, ease: ease.out },
  card: { duration: duration.slow, ease: ease.out },
  route: { duration: 0.36, ease: ease.out },
  reveal: { duration: 0.75, ease: ease.inOut },
} as const satisfies Record<string, Transition>

/** Gaps between items that enter one after another. */
export const stagger = {
  hero: 0.06,
  list: 0.07,
  stars: 0.07,
} as const

/** Rise-in used for hero items and list rows. */
export const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
} as const

/** Vibration patterns in ms (phones that support it; never required). */
export const vibration = {
  tap: 10,
  refused: 30,
  startComing: 30,
  yourTurn: [200, 100, 200],
} as const

export function vibrate(pattern: number | readonly number[]) {
  try {
    navigator.vibrate?.(pattern as number | number[])
  } catch {
    // Not supported (iPhone, desktop): ignore.
  }
}
