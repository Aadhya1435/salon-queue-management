import '@fontsource-variable/plus-jakarta-sans'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { registerSW } from 'virtual:pwa-register'
import { router } from './router'
import './styles/index.css'

// Screens from an older deploy that fail to load reload once to the new
// version: see screen() in router.tsx.

// Offline app shell. On every deploy the new service worker takes over and the
// page reloads to the new version (registerType: 'autoUpdate').
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
