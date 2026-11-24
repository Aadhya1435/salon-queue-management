// Salon time helpers. The salon runs on India time wherever the phone is.
import { formatClock, SALON_TIME_ZONE } from './format'

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: SALON_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const hourMinuteFormat = new Intl.DateTimeFormat('en-GB', { timeZone: SALON_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Today's date in India, "YYYY-MM-DD" (matches queue_entries.day). */
export function salonDay(date: Date = new Date()): string {
  return dayFormat.format(date)
}

/** Minutes since midnight in India. */
export function salonMinutes(date: Date = new Date()): number {
  const [h, m] = hourMinuteFormat.format(date).split(':').map(Number)
  return h * 60 + m
}

/** "21:00:00" → 1260. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** now + wait, rounded to the nearest 5 minutes: "around 3:00 PM". */
export function aroundClock(now: number, waitMinutes: number): string {
  const step = 5 * 60_000
  return formatClock(new Date(Math.round((now + waitMinutes * 60_000) / step) * step))
}
