import { describe, expect, it } from 'vitest'
import { barberNow, forecastQueue, newCustomerWait, type ForecastBarber, type ForecastEntry } from './estimate'

const NOW = Date.parse('2026-11-24T08:30:00Z') // 2:00 PM in India
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString()

const barber = (id: string, sort: number, extra: Partial<ForecastBarber> = {}): ForecastBarber => ({
  id, sort, on_duty: true, on_break: false, ...extra,
})
let token = 0
const entry = (id: string, extra: Partial<ForecastEntry>): ForecastEntry => ({
  id,
  token: ++token,
  status: 'waiting',
  barber_pref: null,
  assigned_barber: null,
  total_minutes: 30,
  joined_at: minsAgo(60 - token), // later tokens joined later
  started_at: null,
  ...extra,
})

describe('play it forward: the worked example in docs/03-flows-rules.md §4', () => {
  // 2:00 PM. Ravi has a customer in the chair with 10 min left, Amit is free, Imran is on break.
  const barbers = [barber('ravi', 1), barber('amit', 2), barber('imran', 3, { on_break: true })]
  const entries = [
    entry('S-10', { status: 'in_chair', assigned_barber: 'ravi', total_minutes: 30, started_at: minsAgo(20) }),
    entry('S-11', { total_minutes: 30 }),
    entry('S-12', { barber_pref: 'ravi', total_minutes: 15 }),
    entry('S-13', { total_minutes: 45 }),
    entry('S-14', { total_minutes: 30 }),
    entry('S-15', { barber_pref: 'imran', total_minutes: 20 }),
  ]
  const f = forecastQueue(barbers, entries, NOW)
  const est = (id: string) => f.byEntry.get(id)!

  it('S-11 (Any) goes to Amit straight away: 1st', () => expect(est('S-11')).toEqual({ wait: 0, place: 1, barberId: 'amit' }))
  it('S-12 (Ravi) waits for Ravi to finish: 10 min, 2nd', () => expect(est('S-12')).toEqual({ wait: 10, place: 2, barberId: 'ravi' }))
  it('S-13 (Any) goes to Ravi at 25 vs Amit at 30: 3rd', () => expect(est('S-13')).toEqual({ wait: 25, place: 3, barberId: 'ravi' }))
  it('S-14 (Any) goes to Amit at 30 vs Ravi at 70: 4th', () => expect(est('S-14')).toEqual({ wait: 30, place: 4, barberId: 'amit' }))
  it('S-15 (Imran, on break) has no estimate and is 1st for Imran', () => expect(est('S-15')).toEqual({ wait: null, place: 1, barberId: 'imran' }))
  it('a new customer would wait 60 (Any), 70 (Ravi), and get no estimate for Imran', () => {
    expect(newCustomerWait(f, null)).toBe(60)
    expect(newCustomerWait(f, 'ravi')).toBe(70)
    expect(newCustomerWait(f, 'amit')).toBe(60)
    expect(newCustomerWait(f, 'imran')).toBeNull()
  })
})

describe('play it forward: other rules', () => {
  it('with everyone choosing Any, it equals total minutes ahead ÷ barbers working', () => {
    const f = forecastQueue([barber('a', 1), barber('b', 2)], ['1', '2', '3', '4'].map((id) => entry(id, { total_minutes: 30 })), NOW)
    expect(['1', '2', '3', '4'].map((id) => f.byEntry.get(id)!.wait)).toEqual([0, 0, 30, 30])
    expect(newCustomerWait(f, null)).toBe((4 * 30) / 2)
  })

  it('places follow predicted start; ties keep queue order', () => {
    const f = forecastQueue([barber('a', 1), barber('b', 2)], ['1', '2', '3'].map((id) => entry(id, {})), NOW)
    expect(['1', '2', '3'].map((id) => f.byEntry.get(id)!.place)).toEqual([1, 2, 3])
  })

  it('a Called customer who has not sat down counts as their full service time', () => {
    const f = forecastQueue([barber('amit', 1)], [entry('c', { status: 'called', assigned_barber: 'amit', total_minutes: 45 })], NOW)
    expect(newCustomerWait(f, 'amit')).toBe(45)
  })

  it('a cut running late still counts as 2 more minutes', () => {
    const f = forecastQueue([barber('amit', 1)], [entry('c', { status: 'in_chair', assigned_barber: 'amit', total_minutes: 30, started_at: minsAgo(50) })], NOW)
    expect(newCustomerWait(f, 'amit')).toBe(2)
  })

  it('a customer who chose Ravi is never given to another barber', () => {
    const f = forecastQueue([barber('ravi', 1), barber('amit', 2)], [
      entry('busy', { status: 'in_chair', assigned_barber: 'ravi', total_minutes: 30, started_at: minsAgo(0) }),
      entry('x', { barber_pref: 'ravi', total_minutes: 15 }),
    ], NOW)
    expect(f.byEntry.get('x')).toMatchObject({ wait: 30, barberId: 'ravi' })
  })

  it('nobody working: no estimates, place by queue order', () => {
    const f = forecastQueue([barber('a', 1, { on_break: true })], [entry('1', {}), entry('2', {})], NOW)
    expect(f.byEntry.get('2')).toEqual({ wait: null, place: 2, barberId: null })
    expect(newCustomerWait(f, null)).toBeNull()
  })

  it('a new customer with nobody waiting and a free barber waits 0', () => {
    const f = forecastQueue([barber('a', 1)], [], NOW)
    expect(newCustomerWait(f, null)).toBe(0)
  })
})

describe('barberNow', () => {
  const entries = [
    entry('c', { status: 'called', assigned_barber: 'amit', total_minutes: 45 }),
    entry('i', { status: 'in_chair', assigned_barber: 'ravi', total_minutes: 30, started_at: minsAgo(18) }),
  ]
  it('free, busy (in chair), busy (called), on break', () => {
    expect(barberNow({ id: 'imran', on_break: false }, entries, NOW)).toEqual({ kind: 'free' })
    expect(barberNow({ id: 'ravi', on_break: false }, entries, NOW)).toMatchObject({ kind: 'busy', minutesLeft: 12, progress: 0.6 })
    expect(barberNow({ id: 'amit', on_break: false }, entries, NOW)).toMatchObject({ kind: 'busy', minutesLeft: 45, progress: 0 })
    expect(barberNow({ id: 'ravi', on_break: true }, entries, NOW)).toEqual({ kind: 'break' })
  })
})
