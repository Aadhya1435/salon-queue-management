import type { BarberNow } from '../../lib/queue/estimate'

/** ● Free · ● Busy · 12 min left · ● On break (status in words and colour). */
export function StatusChip({ state, label }: { state: BarberNow; label?: string }) {
  if (state.kind === 'free')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-3 py-1 text-caption font-semibold text-success">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
        {label ?? 'Free'}
      </span>
    )
  if (state.kind === 'break')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-caption font-semibold text-muted">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-break" />
        {label ?? 'On break'}
      </span>
    )
  return (
    <span className="num inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-caption font-semibold text-text">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
      {label ?? `Busy · ${state.minutesLeft} min left`}
    </span>
  )
}
