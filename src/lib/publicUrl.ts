// The public address that QR codes open (docs/02-screens.md → Screen 8).
// QR codes must not use the address the page happens to be open on: a poster
// printed from localhost or a protected preview link would send customers nowhere.

const DEFAULT_PUBLIC_URL = 'https://roselle-salon.vercel.app'

/** e.g. "https://roselle-salon.vercel.app" (no trailing slash). Override with VITE_PUBLIC_URL. */
export const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')

/** The Join page: where every "Scan to join" QR code goes. */
export const JOIN_URL = `${PUBLIC_URL}/join`

/** The same address without "https://", for printing under a QR code. */
export const JOIN_URL_SHORT = JOIN_URL.replace(/^https?:\/\//, '')

/** A customer's private status link (the walk-in "Scan to follow your place" QR). */
export const statusUrl = (id: string) => `${PUBLIC_URL}/status/${id}`
