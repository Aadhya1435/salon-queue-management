import { useEffect, useState } from 'react'
import { friendlyError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; salon: string; barbers: number; services: number }
  | { kind: 'error'; message: string }

/** Step 1 check: reads the demo data from Supabase to prove keys + schema work. */
export default function DbCheck() {
  const [state, setState] = useState<State>(
    isSupabaseConfigured ? { kind: 'loading' } : { kind: 'error', message: 'Supabase keys are missing. Copy .env.example to .env.local.' },
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    ;(async () => {
      try {
        const [settings, barbers, services] = await Promise.all([
          supabase.from('settings').select('salon_name').single(),
          supabase.from('barbers').select('id', { count: 'exact', head: true }).eq('on_duty', true),
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('active', true),
        ])
        const error = settings.error ?? barbers.error ?? services.error
        if (error) throw error
        if (!settings.data) throw new Error('settings_missing')
        if (alive) setState({ kind: 'ok', salon: settings.data.salon_name, barbers: barbers.count ?? 0, services: services.count ?? 0 })
      } catch (error) {
        if (alive) setState({ kind: 'error', message: `Can't read the database. ${friendlyError(error)}` })
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const dot = state.kind === 'ok' ? 'bg-success' : state.kind === 'error' ? 'bg-danger' : 'bg-break animate-breathe'
  return (
    <section aria-live="polite" className="flex items-center gap-3 rounded-card bg-surface p-5 shadow-card">
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${dot}`} />
      <p className="text-small">
        {state.kind === 'loading' && 'Checking the database…'}
        {state.kind === 'ok' && (
          <>
            <b>Database connected</b> · {state.salon} · <span className="num">{state.barbers}</span> barbers on duty ·{' '}
            <span className="num">{state.services}</span> services
          </>
        )}
        {state.kind === 'error' && <span className="text-danger">{state.message}</span>}
      </p>
    </section>
  )
}
