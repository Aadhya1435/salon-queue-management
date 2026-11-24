import { RefreshCw } from 'lucide-react'
import { useRouteError } from 'react-router'
import { clearUpdateReloadFlag, isStaleChunkError } from '../lib/appUpdate'

/** Friendly page instead of React Router's "Unexpected Application Error!". */
export default function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunkError(error)
  console.error(error)

  return (
    <main className="grid min-h-dvh place-items-center bg-linear-to-br from-hero to-hero-2 px-5">
      <div className="w-full max-w-sm rounded-sheet bg-surface p-6 text-center shadow-pop">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
          <RefreshCw size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-title font-bold">{stale ? 'A new version is ready' : 'Something went wrong'}</h1>
        <p className="mt-1 text-small text-muted">
          {stale ? 'Roselle was just updated. Reload to get the latest version.' : 'Please reload the page. If it keeps happening, go back to Home.'}
        </p>
        <button
          type="button"
          onClick={() => {
            clearUpdateReloadFlag()
            window.location.reload()
          }}
          className="mt-5 h-14 w-full rounded-full bg-primary text-body font-bold text-on-primary shadow-pop active:scale-[0.97]"
        >
          Reload
        </button>
        <a href="/" className="mt-2 inline-flex min-h-11 items-center text-small font-semibold text-muted underline underline-offset-2">
          Go to Home
        </a>
      </div>
    </main>
  )
}
