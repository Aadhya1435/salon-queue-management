import { describe, expect, it } from 'vitest'
import { roundUpTo5, waitPhrase, waitShort } from './display'

describe('how the wait is shown (docs §4)', () => {
  it('0 min and 1st in line → any moment now', () => expect(waitPhrase(0, 1)).toBe('any moment now'))
  it('1–4 min → under 5 min', () => {
    expect(waitPhrase(1)).toBe('under 5 min')
    expect(waitPhrase(4.9)).toBe('under 5 min')
  })
  it('otherwise about N min, rounded UP to the next 5', () => {
    expect(waitPhrase(5)).toBe('about 5 min')
    expect(waitPhrase(31)).toBe('about 35 min')
    expect(waitPhrase(50)).toBe('about 50 min')
  })
  it('never 0 min while someone is ahead', () => expect(waitPhrase(0, 3)).toBe('under 5 min'))
  it('rounds up to 5', () => expect([0, 0.2, 5, 9.3, 61].map(roundUpTo5)).toEqual([0, 5, 5, 10, 65]))
  it('short labels for barber cards', () => {
    expect(waitShort(0)).toBe('No wait')
    expect(waitShort(47)).toBe('~50 min')
  })
})
