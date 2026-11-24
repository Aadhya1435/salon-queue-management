import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard focus for a dialog (sheets, the walk-in panel):
 * - on open, focus moves into the dialog (an autoFocus field keeps it)
 * - Tab and Shift+Tab stay inside the dialog
 * - on close, focus goes back to what was focused before (e.g. the button that opened it)
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const raf = requestAnimationFrame(() => {
      const el = ref.current
      if (!el || el.contains(document.activeElement)) return
      ;(el.querySelector<HTMLElement>(FOCUSABLE) ?? el).focus()
    })

    const onKey = (e: KeyboardEvent) => {
      const el = ref.current
      if (e.key !== 'Tab' || !el) return
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((i) => i.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        el.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const inside = el.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      if (before?.isConnected) before.focus()
    }
  }, [open, ref])
}
