import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { SCREENS } from '../lib/routes'

/** Links to every screen, so each route can be opened and checked. */
export default function RouteList({ current, tone = 'app' }: { current?: string; tone?: 'app' | 'tv' }) {
  const tv = tone === 'tv'
  return (
    <nav aria-label="All screens" className={`rounded-card p-5 ${tv ? 'bg-tv-surface' : 'bg-surface shadow-card'}`}>
      <h2 className="text-title font-bold">All screens</h2>
      <ul className={`mt-2 divide-y ${tv ? 'divide-tv-line' : 'divide-border'}`}>
        {SCREENS.map((s) => (
          <li key={s.path}>
            <Link
              to={s.href}
              aria-current={s.path === current ? 'page' : undefined}
              className="group flex min-h-12 items-center gap-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-small font-semibold group-aria-[current=page]:text-accent">{s.name}</span>
                <span className={`num block text-caption ${tv ? 'text-tv-muted' : 'text-muted'}`}>{s.path}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold ${tv ? 'bg-tv-bg' : 'bg-surface-2'}`}>
                {s.access}
              </span>
              <ChevronRight size={16} aria-hidden="true" className={tv ? 'text-tv-muted' : 'text-muted'} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
