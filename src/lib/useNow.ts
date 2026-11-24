import { useEffect, useState } from 'react'
import { serverNow } from './serverClock'

/** The current (server-corrected) time, ticking every 30 s so waits count down by themselves (docs §4). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
