import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import AppShell from './components/AppShell'
import Splash from './components/Splash'
import Home from './screens/Home'
import NotFound from './screens/NotFound'

/** Loads a screen's code only when its route is opened. */
const screen = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

// Routes from docs/02-screens.md → "Routes at a glance".
export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    HydrateFallback: Splash,
    children: [
      { index: true, Component: Home },
      { path: 'join', lazy: screen(() => import('./screens/Join')) },
      { path: 'status/:id', lazy: screen(() => import('./screens/Status')) },
      { path: 'reception', lazy: screen(() => import('./screens/Reception')) },
      { path: 'barber', lazy: screen(() => import('./screens/BarberPicker')) },
      { path: 'barber/:name', lazy: screen(() => import('./screens/Barber')) },
      { path: 'display', lazy: screen(() => import('./screens/Display')) },
      { path: 'admin', lazy: screen(() => import('./screens/Admin')) },
      { path: 'poster', lazy: screen(() => import('./screens/Poster')) },
      { path: 'staff', lazy: screen(() => import('./screens/StaffHub')) },
      { path: '*', Component: NotFound },
    ],
  },
])
