// Small display helpers for the reception dashboard.
/** 372 seconds → "6:12". */
export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function minutesSince(iso: string | null, now: number): number {
  return iso ? Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000)) : 0
}

export function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Staff see the full name when there is one. */
export function displayName(e: { full_name: string | null; first_name: string }) {
  return e.full_name?.trim() || e.first_name
}
