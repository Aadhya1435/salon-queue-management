import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { spring, transition } from '../styles/motion'
import { useDialogFocus } from './useDialogFocus'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode }

/** Bottom sheet on phones, centred card on wider screens. Escape or a backdrop tap closes it. */
export default function Sheet({ open, onClose, title, children }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef, open)

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
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-text/45"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fade}
          />
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-lg outline-none rounded-t-sheet bg-surface px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-pop sm:rounded-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring.soft}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-title font-bold">
                {title}
              </h2>
              <button type="button" onClick={onClose} aria-label="Close" className="-mt-2 -mr-2 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
