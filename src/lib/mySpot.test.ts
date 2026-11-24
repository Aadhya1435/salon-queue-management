import { describe, expect, it } from 'vitest'
import { currentSpot } from './mySpot'

const spot = (id: string, readded_from: string | null = null) => ({ id, readded_from })

describe('currentSpot', () => {
  it('finds the spot itself while it is active', () => {
    expect(currentSpot('a', [spot('x'), spot('a')])?.id).toBe('a')
  })

  it('follows a re-added no-show to its new spot', () => {
    expect(currentSpot('old', [spot('x'), spot('new', 'old')])?.id).toBe('new')
  })

  it('returns nothing when the spot has ended and was not re-added', () => {
    expect(currentSpot('gone', [spot('x'), spot('y', 'other')])).toBeUndefined()
  })
})
