import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'

type Props = {
  to: string
  /** Text next to the arrow ("Staff"). Leave out for a round icon-only button. */
  label?: string
  /** Accessible name when there's no label. */
  ariaLabel?: string
  /** light = on the lilac page, dark = on a plum panel, tv = on the TV board. */
  tone?: 'light' | 'dark' | 'tv'
  className?: string
}

/** The back button on every staff screen. */
export default function BackButton({ to, label, ariaLabel = 'Back', tone = 'light', className = '' }: Props) {
  const colours =
    tone === 'dark'
      ? 'bg-white/15 text-white hover:bg-white/25'
      : tone === 'tv'
        ? 'bg-tv-surface text-tv-text ring-1 ring-tv-line hover:bg-tv-line'
        : 'bg-surface text-text shadow-card hover:bg-surface-2'
  const shape = label ? 'gap-1 pr-4 pl-2.5' : 'w-11 justify-center'
  return (
    <Link
      to={to}
      aria-label={label ? undefined : ariaLabel}
      className={`inline-flex h-11 shrink-0 items-center rounded-full text-small font-semibold transition-colors active:scale-[0.97] ${shape} ${colours} ${className}`}
    >
      <ChevronLeft size={20} aria-hidden="true" />
      {label}
    </Link>
  )
}
