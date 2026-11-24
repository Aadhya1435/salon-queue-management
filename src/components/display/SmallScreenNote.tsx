import { MonitorPlay } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'

/** Narrower than a 1024 px laptop/tablet, or a portrait screen: too small for the TV board. */
const SMALL = '(max-width: 1023px), (max-aspect-ratio: 1/1)'

function useSmallScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(SMALL)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(SMALL).matches,
    () => false,
  )
}

/**
 * The TV screen opened on a phone (docs/02-screens.md → Screen 6): explain that the board
 * is made for a large landscape display, so a phone shows only part of it.
 */
export default function SmallScreenNote() {
  const small = useSmallScreen()
  const [dismissed, setDismissed] = useState(false)
  if (!small || dismissed) return null

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-tv-bg/95 px-5 py-8 text-tv-text">
      <div role="dialog" aria-modal="true" aria-labelledby="small-screen-title" className="w-full max-w-sm rounded-sheet bg-tv-surface p-6 text-center shadow-pop">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-tv-accent text-tv-on-accent">
          <MonitorPlay size={26} />
        </span>
        <h1 id="small-screen-title" className="mt-4 text-title font-extrabold tracking-tight">
          This is the waiting-area TV screen
        </h1>
        <p className="mt-2 text-small text-tv-muted">
          It's made for a large landscape display, like the salon's TV or a laptop. A phone screen is too small for it, so you'll only see part of the board.
        </p>
        <p className="mt-2 text-small text-tv-muted">To see the whole screen, open this page on a laptop or TV.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="h-14 rounded-full bg-tv-accent px-6 text-body font-bold text-tv-on-accent active:scale-[0.97]"
          >
            Show it anyway
          </button>
          <Link to="/staff" className="inline-flex min-h-11 items-center justify-center text-small font-semibold text-tv-muted underline underline-offset-2">
            Back to staff screens
          </Link>
        </div>
      </div>
    </div>
  )
}
