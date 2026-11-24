/**
 * Is online joining open right now? docs/03-flows-rules.md §5.
 * This mirrors the database rule so the Join button can explain itself; the
 * database (join_queue) still has the final say.
 */
import { formatTimeOfDay } from '../format'
import { timeToMinutes } from '../time'
import type { Barber, Settings } from '../types'

export const ONLINE_CLOSES_BEFORE_CLOSING = 30 // minutes

export type OnlineWindow =
  | { open: true }
  | { open: false; reason: 'online_closed' | 'not_open_yet' | 'salon_closed' | 'no_barbers'; message: string }

type Hours = Pick<Settings, 'online_open' | 'open_time' | 'close_time'>

export function onlineJoinWindow(settings: Hours, barbersOnDuty: readonly Pick<Barber, 'on_duty'>[], nowMinutes: number): OnlineWindow {
  const open = timeToMinutes(settings.open_time)
  const close = timeToMinutes(settings.close_time)
  const opens = formatTimeOfDay(settings.open_time)
  const closes = formatTimeOfDay(settings.close_time)

  if (nowMinutes >= close) return { open: false, reason: 'salon_closed', message: `We're closed for today. Online joining opens at ${opens}.` }
  if (nowMinutes < open) return { open: false, reason: 'not_open_yet', message: `We open at ${opens}.` }
  if (!settings.online_open || nowMinutes >= close - ONLINE_CLOSES_BEFORE_CLOSING) {
    return { open: false, reason: 'online_closed', message: `Online queue is closed right now. Walk-ins welcome until ${closes}.` }
  }
  if (!barbersOnDuty.some((b) => b.on_duty)) return { open: false, reason: 'no_barbers', message: 'No barbers available right now.' }
  return { open: true }
}

/** "Open · until 9:00 PM" or "Closed · opens 10:00 AM". */
export function openStatus(settings: Pick<Settings, 'open_time' | 'close_time'>, nowMinutes: number): { open: boolean; label: string } {
  const isOpen = nowMinutes >= timeToMinutes(settings.open_time) && nowMinutes < timeToMinutes(settings.close_time)
  return isOpen
    ? { open: true, label: `Open · until ${formatTimeOfDay(settings.close_time)}` }
    : { open: false, label: `Closed · opens ${formatTimeOfDay(settings.open_time)}` }
}
