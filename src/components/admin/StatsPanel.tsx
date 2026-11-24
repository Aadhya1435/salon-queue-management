import { animate, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { OwnerStats } from '../../lib/api'
import { formatRupees } from '../../lib/format'
import { useNow } from '../../lib/useNow'
import { salonMinutes, timeToMinutes } from '../../lib/time'
import type { Barber, Settings } from '../../lib/types'
import { ease, rise, stagger, transition } from '../../styles/motion'
import { CountUp } from '../Numbers'

const CHART_MS = 600 // Motion moment 22: 600 ms, stagger 40 ms

/** Counts up from 0 once, with a formatter (for ₹ and decimals). */
function CountTo({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (reduce) return
    const controls = animate(from.current, value, {
      duration: CHART_MS / 1000,
      ease: ease.out,
      onUpdate: (v) => {
        from.current = v
        setShown(v)
      },
    })
    return () => controls.stop()
  }, [value, reduce])

  return <span className="num">{format(reduce ? value : shown)}</span>
}

function hourLabel(h: number) {
  const suffix = h >= 12 ? 'p' : 'a'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}${suffix}`
}

const axisTick = { fill: 'var(--color-muted)', fontSize: 12 }
const tooltipProps = {
  cursor: { fill: 'var(--color-surface-2)' },
  contentStyle: {
    background: 'var(--color-surface)',
    border: 'none',
    borderRadius: 14,
    boxShadow: 'var(--shadow-pop)',
    color: 'var(--color-text)',
    fontSize: 13,
  },
  labelStyle: { fontWeight: 700 },
}

/** Six stat cards: 2 / 3 across on phone, 6 across on desktop. */
export function StatCards({ stats }: { stats: OwnerStats | null }) {
  const cards: { label: string; node: React.ReactNode }[] = stats
    ? [
        { label: 'Served', node: <CountUp value={stats.served} /> },
        {
          label: 'Avg wait',
          node:
            stats.avg_wait_min === null ? (
              '–'
            ) : (
              <>
                <CountUp value={Math.round(Number(stats.avg_wait_min))} />
                <span className="ml-1 text-small font-semibold text-muted">min</span>
              </>
            ),
        },
        { label: 'No-shows', node: <CountUp value={stats.no_shows} /> },
        { label: 'Cancelled', node: <CountUp value={stats.cancelled} /> },
        { label: 'Est. takings', node: <CountTo value={Number(stats.takings)} format={formatRupees} /> },
        {
          label: 'Avg rating',
          node:
            stats.avg_rating === null ? (
              '–'
            ) : (
              <>
                <CountTo value={Number(stats.avg_rating)} format={(n) => n.toFixed(1)} />
                <span className="ml-1 text-accent">★</span>
              </>
            ),
        },
      ]
    : []

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {!stats &&
        [0, 1, 2, 3, 4, 5].map((i) => <li key={i} aria-hidden="true" className="h-24 animate-pulse rounded-tile bg-surface-2" />)}
      {cards.map((c, i) => (
        <motion.li
          key={c.label}
          {...rise}
          transition={{ ...transition.card, delay: i * stagger.hero }}
          className="flex min-w-0 flex-col justify-between gap-2 rounded-tile bg-surface p-4 shadow-card"
        >
          <span className="text-caption font-semibold text-muted">{c.label}</span>
          <span className="num truncate text-heading font-extrabold">{c.node}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function ChartCard({ title, children, sub }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-card bg-surface p-5 shadow-card">
      <h3 className="text-body font-bold">{title}</h3>
      {sub && <p className="text-caption text-muted">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** The three charts (customers per hour, served per barber, wait by hour), or the empty state. */
export function StatCharts({ stats, settings, barbers }: { stats: OwnerStats | null; settings: Settings | null; barbers: Barber[] }) {
  const reduce = useReducedMotion()
  const now = useNow()
  const anim = (i: number) => ({ isAnimationActive: !reduce, animationDuration: CHART_MS, animationBegin: 150 + i * 40 * 4 })

  const joins = useMemo(() => {
    if (!stats) return []
    const byHour = new Map(stats.joins_by_hour.map((r) => [r.hour, Number(r.count)]))
    const hours = stats.joins_by_hour.map((r) => r.hour)
    const nowHour = Math.floor(salonMinutes(new Date(now)) / 60)
    const openHour = settings ? Math.floor(timeToMinutes(settings.open_time) / 60) : 10
    // From opening (or the first join, if the salon opens at midnight) to now.
    const first = hours.length ? Math.min(...hours) : openHour
    const start = openHour > 0 ? Math.min(openHour, first) : first
    const end = Math.max(nowHour, ...hours, start)
    const rows = []
    for (let h = start; h <= end; h++) rows.push({ hour: hourLabel(h), count: byHour.get(h) ?? 0 })
    return rows
  }, [stats, settings, now])

  const perBarber = useMemo(
    () =>
      (stats?.per_barber ?? []).map((b) => ({
        name: b.name,
        served: Number(b.served),
        label: b.avg_rating === null ? `${b.served}` : `${b.served} · ★ ${Number(b.avg_rating).toFixed(1)}`,
        color: barbers.find((x) => x.id === b.barber_id)?.color ?? 'var(--color-accent)',
      })),
    [stats, barbers],
  )

  const waits = useMemo(
    () => (stats?.wait_by_hour ?? []).map((r) => ({ hour: hourLabel(r.hour), wait: Number(r.avg_wait_min) })),
    [stats],
  )

  if (!stats) return <div aria-hidden="true" className="h-64 animate-pulse rounded-card bg-surface-2" />

  const empty = stats.joins_by_hour.length === 0 && stats.served === 0 && stats.no_shows === 0 && stats.cancelled === 0
  if (empty) {
    return (
      <p className="rounded-card bg-surface p-6 text-center text-small text-muted shadow-card">
        No customers yet today. Stats appear after the first visit.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Customers per hour" sub="Joined today">
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={joins} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} formatter={(v) => [v, 'Joined']} />
            <Bar dataKey="count" fill="var(--color-accent)" radius={[8, 8, 3, 3]} maxBarSize={28} {...anim(0)} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Served per stylist" sub="With each stylist's average rating">
        <ResponsiveContainer width="100%" height={Math.max(120, perBarber.length * 46)}>
          <BarChart data={perBarber} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
            <XAxis type="number" hide allowDecimals={false} domain={[0, (max: number) => Math.max(1, max)]} />
            <YAxis type="category" dataKey="name" width={64} tick={{ ...axisTick, fill: 'var(--color-text)', fontWeight: 600 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipProps} formatter={(v) => [v, 'Served']} />
            <Bar dataKey="served" radius={[4, 10, 10, 4]} barSize={22} minPointSize={4} {...anim(1)}>
              {perBarber.map((b) => (
                <Cell key={b.name} fill={b.color} />
              ))}
              <LabelList
                dataKey="label"
                content={(p) => {
                  const x = Number(p.x ?? 0) + Number(p.width ?? 0) + 8
                  const y = Number(p.y ?? 0) + Number(p.height ?? 0) / 2
                  return (
                    <text x={x} y={y} dominantBaseline="central" style={{ fill: 'var(--color-text)', fontSize: 12, fontWeight: 700, whiteSpace: 'pre' }}>
                      {p.value}
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Average wait by hour" sub="Minutes from joining to being called">
        {waits.length === 0 ? (
          <p className="py-6 text-center text-small text-muted">No one has been called yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={waits} margin={{ top: 8, right: 12, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipProps} cursor={{ stroke: 'var(--color-border)' }} formatter={(v) => [`${v} min`, 'Avg wait']} />
              <Line
                type="monotone"
                dataKey="wait"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                {...anim(2)}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
