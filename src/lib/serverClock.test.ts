import { afterEach, describe, expect, it, vi } from 'vitest'

/** Loads a fresh copy of the module with a fake server whose clock is `serverAheadMs` ahead of this machine. */
async function clockWithServerAhead(serverAheadMs: number) {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key')
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { headers: { date: new Date(Date.now() + serverAheadMs).toUTCString() } })))
  const clock = await import('./serverClock')
  await clock.syncServerClock()
  return clock
}

describe('server clock (docs/03-flows-rules.md §4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("corrects a phone whose clock is 10 minutes slow", async () => {
    const clock = await clockWithServerAhead(10 * 60_000)
    expect(Math.abs(clock.serverNow() - (Date.now() + 10 * 60_000))).toBeLessThan(2_000)
  })

  it('ignores a difference of a second or two', async () => {
    const clock = await clockWithServerAhead(1_500)
    expect(Math.abs(clock.serverNow() - Date.now())).toBeLessThan(50)
  })

  it('keeps the phone clock when the server cannot be reached', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))))
    const clock = await import('./serverClock')
    await clock.syncServerClock()
    expect(Math.abs(clock.serverNow() - Date.now())).toBeLessThan(50)
  })
})
