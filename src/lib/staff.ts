/**
 * Staff session: the PIN this device signed in with and its role.
 * Stored on the device until [Lock] (docs/03-flows-rules.md §9).
 * Every staff/owner database call sends the PIN; the database checks it.
 */
import { useSyncExternalStore } from 'react'
import { errorCode } from './errors'
import { supabase } from './supabase'
import type { StaffRole } from './types'

const KEY = 'waitly:staff'
const LOCK_KEY = 'waitly:pin-lock'

export type StaffSession = { pin: string; role: StaffRole }

function read(): StaffSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as StaffSession | null
    return s && typeof s.pin === 'string' && (s.role === 'staff' || s.role === 'owner') ? s : null
  } catch {
    return null
  }
}

let session: StaffSession | null = read()
const listeners = new Set<() => void>()

function setSession(next: StaffSession | null) {
  session = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked: session lasts for this page only
  }
  listeners.forEach((l) => l())
}

/** Checks a PIN with the database and signs this device in. Throws invalid_pin. */
export async function staffLogin(pin: string): Promise<StaffSession> {
  const { data, error } = await supabase.rpc('staff_login', { p_pin: pin })
  if (error) throw error
  const next = { pin, role: data as StaffRole }
  setSession(next)
  return next
}

/** [Lock]: signs this device out. */
export function lockStaff() {
  setSession(null)
}

/** If a call failed because the PIN was changed elsewhere, sign out so the PIN screen shows again. */
export function handleStaffError(error: unknown) {
  if (errorCode(error) === 'invalid_pin') lockStaff()
}

export function useStaffSession(): StaffSession | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => session,
    () => session,
  )
}

/** Does this session open a screen that needs `need`? The owner PIN opens everything. */
export function canOpen(s: StaffSession | null, need: StaffRole): boolean {
  return Boolean(s && (need === 'staff' || s.role === 'owner'))
}

// After 5 wrong PINs, wait 30 s (per device).
export const MAX_TRIES = 5
export const LOCKOUT_MS = 30_000

export function pinLockedUntil(): number {
  try {
    return Number(localStorage.getItem(LOCK_KEY) ?? 0)
  } catch {
    return 0
  }
}

export function setPinLockedUntil(until: number) {
  try {
    localStorage.setItem(LOCK_KEY, String(until))
  } catch {
    // ignore
  }
}
