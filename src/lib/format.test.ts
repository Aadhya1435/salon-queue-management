import { describe, expect, it } from 'vitest'
import { formatClock, formatPhone, formatRupees, formatTimeOfDay, formatToken, ordinal } from './format'

describe('format', () => {
  it('formats rupees without decimals', () => {
    expect(formatRupees(230)).toBe('₹230')
    expect(formatRupees(1200)).toBe('₹1,200')
  })

  it('formats phones as 98765 43210', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210')
    expect(formatPhone('+91 98765-43210')).toBe('98765 43210')
    expect(formatPhone('123')).toBe('123')
  })

  it('writes places in line as ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd'])
  })

  it('shows clock times in India time', () => {
    // 08:55 UTC = 2:25 PM in India (UTC+5:30)
    expect(formatClock(new Date('2026-11-24T08:55:00Z'))).toBe('2:25 PM')
    expect(formatClock(new Date('2026-11-24T18:30:00Z'))).toBe('12:00 AM')
  })

  it('formats opening hours from Postgres times', () => {
    expect(formatTimeOfDay('21:00:00')).toBe('9:00 PM')
    expect(formatTimeOfDay('10:00:00')).toBe('10:00 AM')
    expect(formatTimeOfDay('00:00:00')).toBe('12:00 AM')
    expect(formatTimeOfDay('12:30:00')).toBe('12:30 PM')
  })

  it('formats tokens', () => {
    expect(formatToken(14)).toBe('S-14')
  })
})
