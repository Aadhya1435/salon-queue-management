import { describe, expect, it } from 'vitest'
import { onlineJoinWindow, openStatus } from './joinWindow'

const hours = { online_open: true, open_time: '10:00:00', close_time: '21:00:00' }
const onDuty = [{ on_duty: true }]
const at = (h: number, m = 0) => h * 60 + m
/** Most tests have services on; the last one switches them all off. */
const win = (settings: typeof hours, barbers: { on_duty: boolean }[], now: number, services = 3) => onlineJoinWindow(settings, barbers, now, services)

describe('online joining window (docs §5)', () => {
  it('open during the day', () => expect(win(hours, onDuty, at(14))).toEqual({ open: true }))
  it('owner switched it off', () =>
    expect(win({ ...hours, online_open: false }, onDuty, at(14))).toMatchObject({
      open: false, reason: 'online_closed', message: 'Online queue is closed right now. Walk-ins welcome until 9:00 PM.',
    }))
  it('closes automatically 30 min before closing', () => {
    expect(win(hours, onDuty, at(20, 29)).open).toBe(true)
    expect(win(hours, onDuty, at(20, 30))).toMatchObject({ open: false, reason: 'online_closed' })
  })
  it('before opening', () => expect(win(hours, onDuty, at(9, 15))).toMatchObject({ open: false, message: 'We open at 10:00 AM.' }))
  it('after closing', () => expect(win(hours, onDuty, at(21, 5))).toMatchObject({ open: false, reason: 'salon_closed' }))
  it('no barbers on duty', () => expect(win(hours, [], at(14))).toMatchObject({ open: false, reason: 'no_barbers' }))
  it('every service switched off', () =>
    expect(win(hours, onDuty, at(14), 0)).toMatchObject({ open: false, reason: 'no_services', message: 'No services are available online right now.' }))
  it('open / closed badge', () => {
    expect(openStatus(hours, at(14))).toEqual({ open: true, label: 'Open · until 9:00 PM' })
    expect(openStatus(hours, at(22))).toEqual({ open: false, label: 'Closed · opens 10:00 AM' })
  })
})
