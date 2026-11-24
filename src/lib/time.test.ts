import { describe, expect, it } from 'vitest'
import { aroundClock, salonDay, salonMinutes, timeToMinutes } from './time'

describe('salon time (India)', () => {
  it('the salon day flips at midnight India time, not UTC', () => {
    expect(salonDay(new Date('2026-11-24T18:29:00Z'))).toBe('2026-11-24') // 11:59 PM IST
    expect(salonDay(new Date('2026-11-24T18:30:00Z'))).toBe('2026-11-25') // 12:00 AM IST
  })
  it('minutes since midnight', () => {
    expect(salonMinutes(new Date('2026-11-24T08:55:00Z'))).toBe(14 * 60 + 25)
    expect(timeToMinutes('21:00:00')).toBe(1260)
  })
  it('"around" times are rounded to 5 minutes', () => {
    const twoTen = Date.parse('2026-11-24T08:40:00Z') // 2:10 PM IST
    expect(aroundClock(twoTen, 50)).toBe('3:00 PM')
    expect(aroundClock(twoTen, 47)).toBe('2:55 PM')
  })
})
