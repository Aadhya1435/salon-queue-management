// Join form rules: docs/03-flows-rules.md §5. The database checks these again.

export const MAX_SERVICES = 3

/**
 * Keeps the 10 digits of an Indian mobile number from whatever was typed or pasted.
 * Drops a +91 / 91 country code and a leading 0 (mobiles never start with 0).
 */
export function phoneDigits(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2)
  return digits.replace(/^0+/, '').slice(0, 10)
}

/** "9876543210" → "98765 43210" while typing. */
export function formatPhoneInput(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
}

/** null when valid. */
export function phoneError(digits: string): string | null {
  if (digits.length !== 10) return 'Enter a 10-digit mobile number'
  if (!/^[6-9]/.test(digits)) return 'Mobile numbers start with 6, 7, 8 or 9'
  return null
}

/** Invisible characters (zero-width spaces and joiners, BOM, control codes) that would show as a blank name. */
// oxlint-disable-next-line no-control-regex -- removing control characters is the point
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g

export function cleanName(input: string): string {
  return input.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim()
}

/** Length in characters as the database counts them (an emoji is 1, not 2). */
const charCount = (text: string) => [...text].length
const letterCount = (text: string) => (text.match(/\p{L}/gu) ?? []).length

/** null when valid. Same rule as private.clean_name in the database. */
export function nameError(input: string): string | null {
  const name = cleanName(input)
  if (letterCount(name) < 2) return 'Enter your name (at least 2 letters)'
  if (charCount(name) > 30) return 'Keep your name under 30 letters'
  return null
}

/** Adds or removes a service; a 4th one is refused. */
export function toggleService(selected: readonly string[], id: string, max = MAX_SERVICES): { selected: string[]; refused: boolean } {
  if (selected.includes(id)) return { selected: selected.filter((s) => s !== id), refused: false }
  if (selected.length >= max) return { selected: [...selected], refused: true }
  return { selected: [...selected, id], refused: false }
}
