import { describe, expect, it } from 'vitest'
import { cleanName, formatPhoneInput, nameError, phoneDigits, phoneError, toggleService } from './joinForm'

describe('phone', () => {
  it('keeps 10 digits from typed or pasted numbers', () => {
    expect(phoneDigits('98765 43210')).toBe('9876543210')
    expect(phoneDigits('+91 98765-43210')).toBe('9876543210')
    expect(phoneDigits('98765432109999')).toBe('9876543210')
  })
  it('formats while typing', () => {
    expect(formatPhoneInput('98765')).toBe('98765')
    expect(formatPhoneInput('987654')).toBe('98765 4')
    expect(formatPhoneInput('9876543210')).toBe('98765 43210')
  })
  it('accepts a 10-digit mobile starting 6–9 only', () => {
    expect(phoneError('9876543210')).toBeNull()
    expect(phoneError('6000000000')).toBeNull()
    expect(phoneError('987654321')).toBe('Enter a 10-digit mobile number')
    expect(phoneError('5876543210')).toBe('Mobile numbers start with 6, 7, 8 or 9')
  })
})

describe('name', () => {
  it('2–30 letters, spaces tidied', () => {
    expect(cleanName('  Kunal   Shah ')).toBe('Kunal Shah')
    expect(nameError('K')).not.toBeNull()
    expect(nameError('Kunal')).toBeNull()
    expect(nameError('x'.repeat(31))).not.toBeNull()
  })
})

describe('services: up to 3', () => {
  it('adds, removes, and refuses a 4th', () => {
    expect(toggleService([], 'a')).toEqual({ selected: ['a'], refused: false })
    expect(toggleService(['a', 'b'], 'a')).toEqual({ selected: ['b'], refused: false })
    expect(toggleService(['a', 'b', 'c'], 'd')).toEqual({ selected: ['a', 'b', 'c'], refused: true })
    expect(toggleService(['a', 'b', 'c'], 'c')).toEqual({ selected: ['a', 'b'], refused: false })
  })
})
