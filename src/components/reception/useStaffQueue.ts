import { useCallback, useEffect, useRef, useState } from 'react'
import { staffQueue } from '../../lib/api'
import { friendlyError } from '../../lib/errors'
import { handleStaffError } from '../../lib/staff'
import type { StaffQueueEntry } from '../../lib/types'

/**
 * Today's full queue (every status, with names and phones) for the reception desk.
 * Refetches whenever the live store's `version` goes up, and on demand after each action.
 */
export function useStaffQueue(pin: string, version: number) {
  const [rows, setRows] = useState<StaffQueueEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(0)

  const refetch = useCallback(async () => {
    const ticket = ++latest.current
    try {
      const data = await staffQueue(pin)
      if (ticket !== latest.current) return // a newer load has started; drop this one
      setRows(data)
      setError(null)
    } catch (e) {
      handleStaffError(e)
      if (ticket === latest.current) setError(friendlyError(e))
    }
  }, [pin])

  useEffect(() => {
    const ticket = ++latest.current
    staffQueue(pin).then(
      (data) => {
        if (ticket !== latest.current) return
        setRows(data)
        setError(null)
      },
      (e: unknown) => {
        handleStaffError(e)
        if (ticket === latest.current) setError(friendlyError(e))
      },
    )
  }, [pin, version])

  return { rows, error, refetch }
}
