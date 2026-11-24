import { Bell, BellRing } from 'lucide-react'
import { useState } from 'react'
import { soundIsOn, unlockSound } from './chime'

/**
 * "Hear a chime when it's your turn" (docs/02-screens.md → Screen 3, item 8).
 * Browsers only allow sound after a tap, so the customer taps once; the chime then
 * plays on "It's your turn" while this page stays open.
 */
export default function SoundCard() {
  const [on, setOn] = useState(soundIsOn)
  const [failed, setFailed] = useState(false)

  async function turnOn() {
    const ok = await unlockSound()
    setOn(ok)
    setFailed(!ok)
  }

  return (
    <div className="flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-card" aria-live="polite">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent">
        {on ? <BellRing size={18} /> : <Bell size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-bold">{on ? 'Sound is on' : "Hear a chime when it's your turn"}</p>
        <p className="text-caption text-muted">
          {on ? 'Keep this page open' : failed ? "This browser won't play sound. Keep this page open." : 'Keep this page open while you wait'}
        </p>
      </div>
      {!on && (
        <button
          type="button"
          onClick={() => void turnOn()}
          className="min-h-11 shrink-0 rounded-full bg-primary px-4 text-small font-bold text-on-primary active:scale-95"
        >
          Turn on sound
        </button>
      )}
    </div>
  )
}
