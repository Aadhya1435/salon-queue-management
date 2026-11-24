/**
 * "How the wait is shown": docs/03-flows-rules.md §4.
 * - 0 min and 1st in line → "any moment now"
 * - 1–4 min → "under 5 min"
 * - otherwise → "about N min", N rounded UP to the next 5
 * - never "0 min" while someone is ahead of you
 */

export function roundUpTo5(minutes: number): number {
  return minutes <= 0 ? 0 : Math.ceil(minutes / 5) * 5
}

/** Lower-case phrase, e.g. "about 35 min". */
export function waitPhrase(wait: number, place = 1): string {
  if (wait <= 0 && place <= 1) return 'any moment now'
  if (wait < 5) return 'under 5 min'
  return `about ${roundUpTo5(wait)} min`
}

/** Short label for barber cards: "~50 min" or "No wait". */
export function waitShort(wait: number): string {
  return wait < 1 ? 'No wait' : `~${roundUpTo5(wait)} min`
}
