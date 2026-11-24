import { Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AnyAvatar, BarberAvatar } from '../BarberAvatar'
import { useDialogFocus } from '../useDialogFocus'
import { PhoneField, TextField } from '../Fields'
import PillButton from '../PillButton'
import { addWalkIn } from '../../lib/api'
import { friendlyError } from '../../lib/errors'
import { formatRupees, formatToken } from '../../lib/format'
import { cleanName, MAX_SERVICES, nameError, phoneError, toggleService } from '../../lib/joinForm'
import { waitPhrase } from '../../lib/queue/display'
import { newCustomerWait, type Forecast } from '../../lib/queue/estimate'
import { statusUrl } from '../../lib/publicUrl'
import { handleStaffError } from '../../lib/staff'
import type { Barber, Service } from '../../lib/types'
import { spring, transition, vibrate, vibration } from '../../styles/motion'

type Props = {
  open: boolean
  onClose: () => void
  pin: string
  services: Service[]
  barbers: Barber[]
  forecast: Forecast
  /** Called after a spot is created, so the dashboard refetches. */
  onAdded: () => void
}

/** "+ Add walk-in": a side sheet on tablet, full screen on phone (docs/02-screens.md → Screen 4). */
export default function WalkInPanel({ open, onClose, ...rest }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-text/45"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fade}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex h-dvh outline-none w-full flex-col bg-bg shadow-pop md:max-w-md md:rounded-l-sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring.soft}
          >
            <div className="flex items-center justify-between gap-4 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2">
              <h2 id={titleId} className="text-title font-bold">
                Add walk-in
              </h2>
              <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
                <X size={20} />
              </button>
            </div>
            <WalkInForm {...rest} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function WalkInForm({ pin, services, barbers, forecast, onAdded, onClose }: Omit<Props, 'open'>) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [barberId, setBarberId] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [serviceNote, setServiceNote] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState<{ id: string; token: number } | null>(null)

  const chosen = services.filter((s) => picked.includes(s.id))
  const minutes = chosen.reduce((sum, s) => sum + s.minutes, 0)
  const price = chosen.reduce((sum, s) => sum + s.price, 0)
  const wait = newCustomerWait(forecast, barberId)
  const chosenBarber = barbers.find((b) => b.id === barberId)

  const nameProblem = nameError(name)
  const phoneProblem = phoneError(phone)
  const servicesProblem = picked.length === 0 ? 'Pick at least 1 service' : null

  function pick(id: string) {
    const next = toggleService(picked, id)
    if (next.refused) {
      vibrate(vibration.refused)
      setServiceNote(`Up to ${MAX_SERVICES} services`)
      return
    }
    setServiceNote(null)
    setPicked(next.selected)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setShowErrors(true)
    setMessage(null)
    if (nameProblem || phoneProblem || servicesProblem) return
    setBusy(true)
    try {
      const result = await addWalkIn(pin, { name: cleanName(name), phone, serviceIds: picked, barberId })
      if (result.existing) {
        setMessage(`Already in the queue as ${formatToken(result.token)}`)
      } else {
        setAdded({ id: result.id, token: result.token })
        onAdded()
      }
    } catch (error) {
      handleStaffError(error)
      setMessage(friendlyError(error))
    } finally {
      setBusy(false)
    }
  }

  if (added) {
    const url = statusUrl(added.id)
    return (
      <motion.div
        className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.soft}
      >
        <span className="grid size-12 place-items-center rounded-full bg-success-tint text-success">
          <Check size={24} strokeWidth={3} aria-hidden="true" />
        </span>
        <div>
          <p className="text-small font-semibold text-muted">{cleanName(name)} is in the queue</p>
          <p className="num mt-1 text-token font-extrabold tracking-tight text-accent">{formatToken(added.token)}</p>
        </div>
        <div className="rounded-card bg-white p-4 text-primary shadow-card">
          <QRCodeSVG value={url} size={176} fgColor="currentColor" bgColor="transparent" title="Status link QR code" />
        </div>
        <p className="text-body font-semibold">Scan to follow your place</p>
        <div className="w-full max-w-xs">
          <PillButton onClick={onClose}>Done</PillButton>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-2 pb-4">
        <TextField
          id="walkin-name"
          label="Name"
          autoComplete="off"
          placeholder="Customer's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={showErrors ? nameProblem : null}
          autoFocus
        />
        <PhoneField id="walkin-phone" digits={phone} onDigits={setPhone} error={showErrors ? phoneProblem : null} />

        <fieldset>
          <legend className="mb-1.5 text-caption font-semibold text-muted">
            Services <span className="font-medium">(up to {MAX_SERVICES})</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {services.map((s) => {
              const on = picked.includes(s.id)
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => pick(s.id)}
                  className={`flex min-h-16 flex-col items-start justify-center rounded-tile px-3 py-2 text-left ring-2 transition-colors ${
                    on ? 'bg-primary text-on-primary ring-primary' : 'bg-surface text-text shadow-card ring-transparent'
                  }`}
                >
                  <span className="text-small font-bold">{s.name}</span>
                  <span className={`num text-caption ${on ? 'text-on-primary/80' : 'text-muted'}`}>
                    {s.minutes} min · {formatRupees(s.price)}
                  </span>
                </motion.button>
              )
            })}
          </div>
          {(serviceNote || (showErrors && servicesProblem)) && (
            <p role="alert" className="mt-1.5 text-caption font-semibold text-danger">
              {serviceNote ?? servicesProblem}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-caption font-semibold text-muted">Stylist</legend>
          <div className="flex flex-wrap gap-2">
            <BarberChip selected={barberId === null} onClick={() => setBarberId(null)} label="Any stylist">
              <AnyAvatar size={28} />
            </BarberChip>
            {barbers.map((b) => (
              <BarberChip key={b.id} selected={barberId === b.id} onClick={() => setBarberId(b.id)} label={b.name} note={b.on_break ? 'On break' : null}>
                <BarberAvatar name={b.name} color={b.color} shape={b.shape} size={28} />
              </BarberChip>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Live summary + submit */}
      <div className="flex flex-col gap-3 border-t border-border bg-surface px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 text-small">
          <span className="num text-muted">
            {chosen.length === 0 ? 'No services yet' : `${chosen.length} service${chosen.length > 1 ? 's' : ''} · ${minutes} min · ${formatRupees(price)}`}
          </span>
          <span className="num text-right font-semibold">
            {wait === null ? (chosenBarber ? `${chosenBarber.name} is on break` : 'No stylists working') : wait < 1 ? 'No wait: next in the chair' : `Your turn in ${waitPhrase(wait)}`}
          </span>
        </div>
        {message && (
          <p role="alert" className="rounded-tile bg-warning-tint px-3 py-2 text-small font-semibold text-warning">
            {message}
          </p>
        )}
        <PillButton type="submit" state={busy ? 'loading' : 'idle'}>
          Add to queue
        </PillButton>
      </div>
    </form>
  )
}

function BarberChip({
  selected,
  onClick,
  label,
  note = null,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  note?: string | null
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex min-h-12 items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-small font-semibold ring-2 transition-colors ${
        selected ? 'bg-accent-tint ring-primary' : 'bg-surface shadow-card ring-transparent'
      }`}
    >
      {children}
      <span>{label}</span>
      {note && <span className="text-caption font-medium text-muted">{note}</span>}
    </motion.button>
  )
}
