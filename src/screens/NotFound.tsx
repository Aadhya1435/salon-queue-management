import { Link } from 'react-router'

/** Any unknown address (docs/02-screens.md → Routes at a glance). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-5 py-10">
      <div className="rounded-card bg-surface p-6 shadow-card">
        <h1 className="text-heading font-extrabold tracking-tight">This page doesn’t exist</h1>
        <p className="mt-2 text-small text-muted">Check the link, or go back to the start.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-6 text-body font-bold text-on-primary transition-transform active:scale-[0.97]"
          >
            Go to Home
          </Link>
          <Link
            to="/join"
            className="inline-flex h-14 items-center justify-center rounded-full bg-surface-2 px-6 text-body font-bold text-text transition-transform active:scale-[0.97]"
          >
            Join the queue
          </Link>
        </div>
      </div>
    </main>
  )
}
