// "Now" for the queue is the server's time, not the phone's (docs/03-flows-rules.md §4).
// A phone set a few minutes wrong would otherwise show the wrong open/closed state,
// waits and "around 3:00 PM" times. The app reads the server clock once (the Date
// header of a tiny database read) and keeps the difference.

let offsetMs = 0
let started = false

/** Milliseconds since 1970, corrected to the server's clock. */
export function serverNow(): number {
  return Date.now() + offsetMs
}

/** Measures the phone's clock against the server's, once per page load. */
export async function syncServerClock(): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (started || !url || !key) return
  started = true
  try {
    const sent = Date.now()
    const res = await fetch(`${url}/rest/v1/settings?select=id`, { headers: { apikey: key }, cache: 'no-store' })
    const received = Date.now()
    const header = res.headers.get('date')
    if (!header) return
    // The Date header has whole seconds: +500 ms is its average rounding.
    const diff = Date.parse(header) + 500 - (sent + received) / 2
    // Ignore small differences (rounding, slow networks); fix only a clock that's clearly off.
    offsetMs = Number.isFinite(diff) && Math.abs(diff) > 5_000 ? diff : 0
  } catch {
    started = false // offline: try again on the next load
  }
}
