import { MotionConfig } from 'motion/react'
import { Outlet, ScrollRestoration } from 'react-router'

/** Root layout: every Motion animation follows the phone's "reduce motion" setting. */
export default function AppShell() {
  return (
    <MotionConfig reducedMotion="user">
      <Outlet />
      <ScrollRestoration />
    </MotionConfig>
  )
}
