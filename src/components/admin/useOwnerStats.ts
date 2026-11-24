import { useEffect, useState } from 'react'
import { ownerStats, type OwnerStats } from '../../lib/api'
import { ownerError } from './ownerError'

export type StatsView = { stats: OwnerStats | null; error: string | null }

/** Fetches owner_stats and refetches whenever the live data version changes. */
export function useOwnerStats(pin: string, version: number): StatsView {
  const [view, setView] = useState<StatsView>({ stats: null, error: null })
  useEffect(() => {
    let cancelled = false
    ownerStats(pin)
      .then((stats) => !cancelled && setView({ stats, error: null }))
      .catch((e: unknown) => !cancelled && setView((v) => ({ ...v, error: ownerError(e) })))
    return () => {
      cancelled = true
    }
  }, [pin, version])
  return view
}

