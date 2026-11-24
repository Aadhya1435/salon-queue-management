import type { ServiceSnapshot } from '../../lib/types'

export function ServiceChips({ services, small = false }: { services: ServiceSnapshot[]; small?: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      {services.map((s) => (
        <span key={s.id} className={`rounded-full bg-surface-2 font-semibold text-text ${small ? 'px-2 py-0.5 text-caption' : 'px-2.5 py-1 text-caption'}`}>
          {s.name}
        </span>
      ))}
    </span>
  )
}

/** The barber colour dot used in lists. The colour is data, so it goes through style. */
export function ColorDot({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}
