// Display formats from docs/02-screens.md: times like 2:25 PM, money like ₹230,
// phones like 98765 43210. Times are always shown in India time.

export const SALON_TIME_ZONE = 'Asia/Kolkata'

/** ₹230, ₹1,200 (no decimals). */
export function formatRupees(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

/** 9876543210 → "98765 43210". Anything else is returned unchanged. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : phone
}

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 4 → 4th, 11 → 11th, 22 → 22nd. */
export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}

const clockFormat = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: SALON_TIME_ZONE,
})

/** A Date → "2:25 PM" in India time. */
export function formatClock(date: Date): string {
  return clockFormat.format(date).replace(/\s?(am|pm)$/i, (m) => ' ' + m.trim().toUpperCase())
}

/** "21:00:00" (a Postgres time) → "9:00 PM". */
export function formatTimeOfDay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Token number → "S-14". */
export function formatToken(token: number): string {
  return `S-${token}`
}
