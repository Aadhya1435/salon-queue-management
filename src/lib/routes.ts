// Every route from docs/02-screens.md → "Routes at a glance".

export type Access = 'Public' | 'Private link' | 'Staff PIN' | 'Owner PIN'

export type ScreenRoute = {
  path: string
  /** A link that opens the route (fills in :params with demo values). */
  href: string
  name: string
  access: Access
  device: 'Phone' | 'Tablet' | 'TV' | 'Phone / laptop' | 'Print' | 'Any'
}

export const SCREENS: ScreenRoute[] = [
  { path: '/', href: '/', name: 'Home', access: 'Public', device: 'Phone' },
  { path: '/join', href: '/join', name: 'Join Queue', access: 'Public', device: 'Phone' },
  { path: '/status/:id', href: '/status/demo', name: 'My Status', access: 'Private link', device: 'Phone' },
  { path: '/reception', href: '/reception', name: 'Reception Dashboard', access: 'Staff PIN', device: 'Tablet' },
  { path: '/barber', href: '/barber', name: 'Barber picker', access: 'Staff PIN', device: 'Phone' },
  { path: '/barber/:name', href: '/barber/ravi', name: 'Barber View', access: 'Staff PIN', device: 'Phone' },
  { path: '/display', href: '/display', name: 'Waiting-Area TV', access: 'Public', device: 'TV' },
  { path: '/admin', href: '/admin', name: 'Owner Settings & Stats', access: 'Owner PIN', device: 'Phone / laptop' },
  { path: '/poster', href: '/poster', name: 'QR Poster', access: 'Owner PIN', device: 'Print' },
  { path: '/staff', href: '/staff', name: 'Staff hub', access: 'Public', device: 'Any' },
]
