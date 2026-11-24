import { describe, expect, it } from 'vitest'
import { JOIN_URL, JOIN_URL_SHORT, statusUrl } from './publicUrl'

describe('QR code addresses', () => {
  it('always open the public site, not the address the page is on', () => {
    expect(JOIN_URL).toBe('https://roselle-salon.vercel.app/join')
    expect(JOIN_URL_SHORT).toBe('roselle-salon.vercel.app/join')
    expect(statusUrl('abc')).toBe('https://roselle-salon.vercel.app/status/abc')
  })
})
