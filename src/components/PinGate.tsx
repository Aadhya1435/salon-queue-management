import { Delete, Lock } from 'lucide-react'
import { motion, useAnimate } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { errorCode, friendlyError } from '../lib/errors'
import { canOpen, LOCKOUT_MS, MAX_TRIES, pinLockedUntil, setPinLockedUntil, staffLogin, useStaffSession } from '../lib/staff'
import type { StaffRole } from '../lib/types'
import { vibrate, vibration } from '../styles/motion'

let wrongTries = 0

/**
 * Shows a 4-digit PIN pad until this device is signed in with a PIN that opens
 * the screen (docs/02-screens.md → Screen 9). Staff PIN opens Reception and
 * Barber; Owner PIN opens everything.
 */
export default function PinGate({ need, children }: { need: StaffRole; children: ReactNode }) {
  const session = useStaffSession()
  if (canOpen(session, need)) return <>{children}</>
  return <PinPad need={need} signedInAsStaff={Boolean(session)} />
}

function PinPad({ need, signedInAsStaff }: { need: StaffRole; signedInAsStaff: boolean }) {
  const [digits, setDigits] = useState('')
  const [message, setMessage] = useState<string | null>(
    need === 'owner' && signedInAsStaff ? 'This screen needs the Owner PIN.' : null,
  )
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const lockedUntil = pinLockedUntil()
  const locked = lockedUntil > now

  useEffect(() => {
    if (!locked) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [locked])

  async function submit(pin: string) {
    setBusy(true)
    try {
      const s = await staffLogin(pin)
      wrongTries = 0
      if (need === 'owner' && s.role !== 'owner') {
        setDigits('')
        setMessage("That's the Staff PIN. This screen needs the Owner PIN.")
      }
    } catch (error) {
      setDigits('')
      if (errorCode(error) === 'invalid_pin') {
        wrongTries += 1
        vibrate(vibration.refused)
        animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 })
        if (wrongTries >= MAX_TRIES) {
          wrongTries = 0
          setPinLockedUntil(Date.now() + LOCKOUT_MS)
          setNow(Date.now())
          setMessage(null)
        } else setMessage('Wrong PIN')
      } else setMessage(friendlyError(error))
    } finally {
      setBusy(false)
    }
  }

  function press(key: string) {
    if (busy || locked) return
    if (key === 'back') return setDigits((d) => d.slice(0, -1))
    const next = (digits + key).slice(0, 4)
    setDigits(next)
    setMessage(null)
    if (next.length === 4) void submit(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('back')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const secondsLeft = Math.ceil((lockedUntil - now) / 1000)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-br from-hero to-hero-2 px-5 py-10">
      <motion.div
        ref={scope}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-sheet bg-surface p-6 text-center shadow-pop"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-tint text-accent">
          <Lock size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-title font-bold">{need === 'owner' ? 'Owner only' : 'Staff only'}</h1>
        <p className="mt-1 text-small text-muted">Enter the 4-digit {need === 'owner' ? 'Owner' : 'Staff'} PIN</p>

        <div className="mt-5 flex justify-center gap-3" aria-label={`${digits.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`size-3.5 rounded-full transition-colors ${i < digits.length ? 'bg-primary' : 'bg-surface-2'}`} />
          ))}
        </div>
        <p role="alert" className="mt-3 min-h-5 text-caption font-semibold text-danger">
          {locked ? `Too many tries. Try again in ${secondsLeft} s` : message}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) =>
            key === '' ? (
              <span key="blank" />
            ) : (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.92 }}
                disabled={busy || locked}
                onClick={() => press(key)}
                aria-label={key === 'back' ? 'Delete' : key}
                className="num grid h-16 place-items-center rounded-full bg-surface-2 text-title font-bold text-text disabled:opacity-50"
              >
                {key === 'back' ? <Delete size={22} aria-hidden="true" /> : key}
              </motion.button>
            ),
          )}
        </div>
        <Link to="/staff" className="mt-5 inline-flex min-h-11 items-center text-small font-semibold text-muted underline underline-offset-2">
          Back to staff screens
        </Link>
      </motion.div>
    </main>
  )
}
