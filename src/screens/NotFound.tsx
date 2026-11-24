import { Link } from 'react-router'
import RouteList from '../components/RouteList'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 px-5 py-10">
      <div className="rounded-card bg-surface p-6 shadow-card">
        <h1 className="text-heading font-extrabold tracking-tight">This page doesn’t exist</h1>
        <p className="mt-2 text-small text-muted">Check the link, or go back to the start.</p>
        <Link
          to="/"
          className="mt-5 inline-flex h-14 items-center rounded-full bg-primary px-6 text-body font-bold text-on-primary transition-transform active:scale-[0.97]"
        >
          Go to Home
        </Link>
      </div>
      <RouteList />
    </main>
  )
}
