import { ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { rise, stagger, transition } from '../styles/motion'
import BlobCluster from './BlobCluster'
import RouteList from './RouteList'

type Props = {
  number: string
  route: string
  title: string
  who: string
  access: string
  device: string
  step: number
  plan: string[]
  tone?: 'app' | 'tv'
  children?: ReactNode
}

/**
 * Step 1 placeholder for a screen: themed header, what the screen will hold
 * (from docs/02-screens.md), and links to every route.
 */
export default function ScreenPlaceholder({ number, route, title, who, access, device, step, plan, tone = 'app', children }: Props) {
  const tv = tone === 'tv'
  const enter = (i: number) => ({ ...rise, transition: { ...transition.card, delay: i * stagger.hero } })

  return (
    <main className={`min-h-dvh pb-12 ${tv ? 'bg-tv-bg text-tv-text' : 'bg-bg text-text'}`}>
      <header
        className={`relative overflow-hidden rounded-b-sheet px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white ${
          tv ? 'bg-tv-surface' : 'bg-linear-to-br from-hero to-hero-2'
        }`}
      >
        <BlobCluster className="pointer-events-none absolute -right-3 top-10 w-32 sm:w-40" />
        <div className="relative mx-auto max-w-2xl pr-24 sm:pr-0">
          {route !== '/' && (
            <Link to="/" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-small font-semibold text-white/80 hover:text-white">
              <ChevronLeft size={18} aria-hidden="true" /> Home
            </Link>
          )}
          <motion.p {...enter(0)} className="mt-2 text-caption font-semibold tracking-[0.1em] text-white/70 uppercase">
            {number} · <span className="num normal-case">{route}</span>
          </motion.p>
          <motion.h1 {...enter(1)} className="mt-1 max-w-[16ch] text-heading font-extrabold tracking-tight">
            {title}
          </motion.h1>
          <motion.p {...enter(2)} className="mt-2 max-w-[42ch] text-small text-white/80">
            {who}
          </motion.p>
          <motion.div {...enter(3)} className="mt-4 flex flex-wrap gap-2">
            {[access, device, `Built in step ${step}`].map((tag) => (
              <span key={tag} className="rounded-full bg-white/15 px-3 py-1 text-caption font-semibold">
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </header>

      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-4 px-5">
        {children}
        <section className={`rounded-card p-5 ${tv ? 'bg-tv-surface' : 'bg-surface shadow-card'}`}>
          <h2 className="text-title font-bold">What goes on this screen</h2>
          <ul className="mt-3 flex flex-col gap-2 text-small">
            {plan.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden="true" className={`mt-[7px] size-1.5 shrink-0 rounded-full ${tv ? 'bg-tv-accent' : 'bg-accent'}`} />
                {line}
              </li>
            ))}
          </ul>
          <p className={`mt-4 text-caption ${tv ? 'text-tv-muted' : 'text-muted'}`}>Full spec: docs/02-screens.md</p>
        </section>
        <RouteList current={route} tone={tone} />
      </div>
    </main>
  )
}
