/**
 * The "play it forward" rule: docs/03-flows-rules.md §4.
 *
 * One calculation powers every waiting number in the app: Home's "about 50 min",
 * the barber cards and "Your turn in about…" on Join, place + ring on My Status,
 * and the TV's "Up next" times. Pure functions, no React, fully unit-tested.
 */
import type { Barber, QueueEntry } from '../types'

export type ForecastBarber = Pick<Barber, 'id' | 'on_duty' | 'on_break' | 'sort'>
export type ForecastEntry = Pick<
  QueueEntry,
  'id' | 'token' | 'status' | 'barber_pref' | 'assigned_barber' | 'total_minutes' | 'joined_at' | 'started_at'
>

export type Estimate = {
  /** Minutes until this customer's turn, or null when it can't be estimated (their barber is on break, or nobody is working). */
  wait: number | null
  /** 1-based place in line. */
  place: number
  /** The barber predicted to serve them (their chosen barber when wait is null). */
  barberId: string | null
}

export type Forecast = {
  byEntry: Map<string, Estimate>
  /** Minutes until each working barber is free once everyone already waiting has been served. */
  freeAfterQueue: Map<string, number>
  /** Barbers on duty and not on break, in their display order. */
  working: string[]
}

/** A cut that's running late still counts as at least 2 more minutes. */
export const MIN_REMAINING_MINUTES = 2
const MS_PER_MINUTE = 60_000

/** Queue order = time of joining (token breaks ties). */
export const byQueueOrder = (a: ForecastEntry, b: ForecastEntry) =>
  Date.parse(a.joined_at) - Date.parse(b.joined_at) || a.token - b.token

function minutesSince(iso: string | null, now: number): number {
  return iso ? (now - Date.parse(iso)) / MS_PER_MINUTE : 0
}

export function forecastQueue(
  barbers: readonly ForecastBarber[],
  entries: readonly ForecastEntry[],
  now: number,
): Forecast {
  const working = barbers
    .filter((b) => b.on_duty && !b.on_break)
    .sort((a, b) => a.sort - b.sort)
    .map((b) => b.id)

  // Step 1: when is each working barber free?
  const freeIn = new Map(working.map((id) => [id, 0]))
  for (const e of entries) {
    const id = e.assigned_barber
    if (!id || !freeIn.has(id)) continue
    if (e.status === 'called') {
      freeIn.set(id, freeIn.get(id)! + e.total_minutes) // about to sit: the full service
    } else if (e.status === 'in_chair') {
      const left = Math.max(MIN_REMAINING_MINUTES, e.total_minutes - minutesSince(e.started_at, now))
      freeIn.set(id, freeIn.get(id)! + left)
    }
  }

  // Step 2: play the waiting list forward, in queue order. Each customer goes to
  // the soonest-free barber they accept (tie → the one listed first): the same
  // rule Call next uses, run ahead of time.
  const waiting = entries.filter((e) => e.status === 'waiting').sort(byQueueOrder)
  const byEntry = new Map<string, Estimate>()
  const starts: { id: string; start: number; order: number }[] = []

  waiting.forEach((e, order) => {
    const accepts = e.barber_pref === null ? working : freeIn.has(e.barber_pref) ? [e.barber_pref] : []
    if (accepts.length === 0) {
      byEntry.set(e.id, { wait: null, place: 0, barberId: e.barber_pref })
      return
    }
    let best = accepts[0]
    for (const id of accepts) if (freeIn.get(id)! < freeIn.get(best)!) best = id
    const start = freeIn.get(best)!
    freeIn.set(best, start + e.total_minutes)
    byEntry.set(e.id, { wait: start, place: 0, barberId: best })
    starts.push({ id: e.id, start, order })
  })

  // Step 3: place = 1 + customers predicted to start earlier (ties keep queue order).
  starts
    .sort((a, b) => a.start - b.start || a.order - b.order)
    .forEach((s, i) => {
      byEntry.get(s.id)!.place = i + 1
    })

  // Customers whose barber is on break: place among those waiting for the same barber.
  waiting.forEach((e, order) => {
    const est = byEntry.get(e.id)!
    if (est.wait !== null) return
    est.place = 1 + waiting.slice(0, order).filter((o) => e.barber_pref === null || o.barber_pref === e.barber_pref).length
  })

  return { byEntry, freeAfterQueue: freeIn, working }
}

/**
 * The wait a NEW customer would get if they joined now with this barber
 * (null = "Any barber"). Null when it can't be estimated.
 */
export function newCustomerWait(forecast: Forecast, barberId: string | null): number | null {
  if (barberId !== null) return forecast.freeAfterQueue.get(barberId) ?? null
  if (forecast.working.length === 0) return null
  return Math.min(...forecast.working.map((id) => forecast.freeAfterQueue.get(id)!))
}

export type BarberNow =
  | { kind: 'free' }
  | { kind: 'break' }
  | { kind: 'busy'; minutesLeft: number; progress: number; token: number }

/** What a barber is doing right now, for status chips and avatar rings. */
export function barberNow(
  barber: Pick<Barber, 'id' | 'on_break'>,
  entries: readonly ForecastEntry[],
  now: number,
): BarberNow {
  if (barber.on_break) return { kind: 'break' }
  const current = entries.find((e) => e.assigned_barber === barber.id && (e.status === 'called' || e.status === 'in_chair'))
  if (!current) return { kind: 'free' }
  if (current.status === 'called') return { kind: 'busy', minutesLeft: current.total_minutes, progress: 0, token: current.token }
  const elapsed = minutesSince(current.started_at, now)
  return {
    kind: 'busy',
    minutesLeft: Math.max(1, Math.ceil(current.total_minutes - elapsed)),
    progress: Math.min(1, Math.max(0, elapsed / current.total_minutes)),
    token: current.token,
  }
}
