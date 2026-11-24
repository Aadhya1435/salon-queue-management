import { Crown, MonitorPlay, Scissors, Tablet } from 'lucide-react'
import { Link } from 'react-router'
import ScreenPlaceholder from '../components/ScreenPlaceholder'

const TILES = [
  { to: '/reception', label: 'Reception', note: 'Staff PIN', Icon: Tablet },
  { to: '/barber', label: 'Barber', note: 'Staff PIN', Icon: Scissors },
  { to: '/display', label: 'TV display', note: 'No PIN', Icon: MonitorPlay },
  { to: '/admin', label: 'Owner', note: 'Owner PIN', Icon: Crown },
]

export default function StaffHub() {
  return (
    <ScreenPlaceholder
      number="Screen 9"
      route="/staff"
      title="Staff"
      who="One place for staff to open their screen. PIN screens arrive in step 4."
      access="Public (screens behind PIN)"
      device="Any"
      step={4}
      plan={['Four big tiles: Reception, Barber, TV display, Owner', 'A 4-digit PIN gate in front of Reception, Barber, Owner and Poster']}
    >
      <div className="grid grid-cols-2 gap-3">
        {TILES.map(({ to, label, note, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-28 flex-col justify-between rounded-card bg-surface p-4 shadow-card transition-transform active:scale-[0.97]"
          >
            <span className="grid size-10 place-items-center rounded-full bg-accent-tint text-accent">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-body font-bold">{label}</span>
              <span className="block text-caption text-muted">{note}</span>
            </span>
          </Link>
        ))}
      </div>
    </ScreenPlaceholder>
  )
}
