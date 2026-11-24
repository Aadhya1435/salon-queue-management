import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import AppShell from './components/AppShell'
import RouteError from './components/RouteError'
import Splash from './components/Splash'
import { clearUpdateReloadFlag, isStaleChunkError, reloadForNewVersion } from './lib/appUpdate'
import Home from './screens/Home'
import NotFound from './screens/NotFound'

/**
 * Loads a screen's code only when its route is opened. If a deploy replaced the
 * file this page knows about, reload once to get the new version.
 */
const screen = (load: () => Promise<{ default: ComponentType }>) => async () => {
  try {
    const module = await load()
    clearUpdateReloadFlag()
    return { Component: module.default }
  } catch (error) {
    if (isStaleChunkError(error) && reloadForNewVersion()) return new Promise<never>(() => {}) // page is reloading
    throw error
  }
}

// Routes from docs/02-screens.md → "Routes at a glance".
export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    HydrateFallback: Splash,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: Home },
      { path: 'join', lazy: screen(() => import('./screens/Join')) },
      { path: 'status/:id', lazy: screen(() => import('./screens/Status')) },
      { path: 'reception', lazy: screen(() => import('./screens/Reception')) },
      { path: 'stylist', lazy: screen(() => import('./screens/BarberPicker')) },
      { path: 'stylist/:name', lazy: screen(() => import('./screens/Barber')) },
      // Old addresses keep working.
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
