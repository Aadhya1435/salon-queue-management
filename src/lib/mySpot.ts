// This phone remembers its own spot (today only), so reopening the app goes back to it.
import { salonDay } from './time'

const KEY = 'roselle:my-spot'

export type MySpot = { id: string; token: number; day: string }

export function loadMySpot(): MySpot | null {
  try {
    const spot = JSON.parse(localStorage.getItem(KEY) ?? 'null') as MySpot | null
    return spot && spot.day === salonDay() ? spot : null
  } catch {
    return null
  }
}

export function saveMySpot(id: string, token: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, token, day: salonDay() } satisfies MySpot))
  } catch {
    // Private mode or storage blocked: the status link still works.
  }
}

/**
 * The active spot that `id` leads to: the spot itself while it is active, or the
 * new spot reception created for it after a no-show (Re-add). `entries` are
 * today's active spots (Waiting / Called / In chair).
 */
export function currentSpot<T extends { id: string; readded_from: string | null }>(id: string, entries: readonly T[]): T | undefined {
  return entries.find((e) => e.id === id) ?? entries.find((e) => e.readded_from === id)
}

export function clearMySpot() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
