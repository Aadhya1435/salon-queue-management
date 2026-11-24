// Calls to the database functions in supabase/migrations/20261124120000_salon_queue.sql.
// Each throws the Supabase error on failure: show it with friendlyError() (lib/errors),
// and for staff calls also pass it to handleStaffError() (lib/staff).
import { supabase } from './supabase'
import type { JoinResult, StaffQueueEntry } from './types'

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

// ── Customer (no PIN) ──
export const joinQueue = (input: { name: string; phone: string; serviceIds: string[]; barberId: string | null }) =>
  call<JoinResult>('join_queue', { p_name: input.name, p_phone: input.phone, p_service_ids: input.serviceIds, p_barber_id: input.barberId })

export const findMySpot = async (phone: string) => (await call<{ id: string; token: number } | null>('find_my_spot', { p_phone: phone })) ?? null

export const cancelMySpot = (id: string) => call<void>('cancel_my_spot', { p_id: id })

export const rateVisit = (id: string, stars: number) => call<void>('rate_visit', { p_id: id, p_stars: stars })

// ── Staff (Staff or Owner PIN) ──
/** Today's queue (all statuses) with full names and phones. */
export const staffQueue = (pin: string) => call<StaffQueueEntry[]>('staff_queue', { p_pin: pin })

export const addWalkIn = (pin: string, input: { name: string; phone: string; serviceIds: string[]; barberId: string | null }) =>
  call<JoinResult>('add_walk_in', { p_pin: pin, p_name: input.name, p_phone: input.phone, p_service_ids: input.serviceIds, p_barber_id: input.barberId })

/** Returns the called customer, or null when nobody is waiting for this barber. */
export const callNext = (pin: string, barberId: string) =>
  call<{ id: string; token: number; first_name: string } | null>('call_next', { p_pin: pin, p_barber_id: barberId })

export const startService = (pin: string, id: string) => call<void>('start_service', { p_pin: pin, p_id: id })
export const finishService = (pin: string, id: string) => call<void>('finish_service', { p_pin: pin, p_id: id })
/** Fails with no_show_too_early (detail = seconds left) before 10 min. */
export const markNoShow = (pin: string, id: string) => call<void>('mark_no_show', { p_pin: pin, p_id: id })
/** A no-show gets a new token at the end. */
export const readd = (pin: string, id: string) => call<JoinResult>('readd', { p_pin: pin, p_id: id })
export const cancelEntry = (pin: string, id: string) => call<void>('cancel_entry', { p_pin: pin, p_id: id })
export const setBreak = (pin: string, barberId: string, onBreak: boolean) =>
  call<void>('set_break', { p_pin: pin, p_barber_id: barberId, p_on_break: onBreak })

// ── Owner (Owner PIN) ──
export const ownerUpdateSettings = (pin: string, input: { salonName: string; openTime: string; closeTime: string }) =>
  call<void>('owner_update_settings', { p_pin: pin, p_salon_name: input.salonName, p_open: input.openTime, p_close: input.closeTime })

export const ownerSetOnline = (pin: string, open: boolean) => call<void>('owner_set_online', { p_pin: pin, p_open: open })

/** id null = add a new service. Returns the service id. */
export const ownerSaveService = (
  pin: string,
  input: { id: string | null; name: string; minutes: number; price: number; active: boolean; sort: number },
) =>
  call<string>('owner_save_service', {
    p_pin: pin, p_id: input.id, p_name: input.name, p_minutes: input.minutes, p_price: input.price, p_active: input.active, p_sort: input.sort,
  })

/** id null = add a new barber. Returns the barber id. */
export const ownerSaveBarber = (pin: string, input: { id: string | null; name: string; color: string; shape: string; sort: number }) =>
  call<string>('owner_save_barber', { p_pin: pin, p_id: input.id, p_name: input.name, p_color: input.color, p_shape: input.shape, p_sort: input.sort })

/** Off duty fails with barber_has_customers (detail = count) unless moveToAny. */
export const ownerSetDuty = (pin: string, barberId: string, onDuty: boolean, moveToAny = false) =>
  call<void>('owner_set_duty', { p_pin: pin, p_barber_id: barberId, p_on_duty: onDuty, p_move_to_any: moveToAny })

export const ownerChangePin = (pin: string, role: 'staff' | 'owner', newPin: string) =>
  call<void>('owner_change_pin', { p_pin: pin, p_role: role, p_new_pin: newPin })

export type OwnerStats = {
  served: number
  avg_wait_min: number | null
  no_shows: number
  cancelled: number
  takings: number
  avg_rating: number | null
  per_barber: { barber_id: string; name: string; served: number; avg_rating: number | null }[]
  joins_by_hour: { hour: number; count: number }[]
  wait_by_hour: { hour: number; avg_wait_min: number }[]
}
export const ownerStats = (pin: string) => call<OwnerStats>('owner_stats', { p_pin: pin })

export const ownerDemoFill = (pin: string) => call<number>('owner_demo_fill', { p_pin: pin })
export const ownerResetToday = (pin: string) => call<void>('owner_reset_today', { p_pin: pin })
