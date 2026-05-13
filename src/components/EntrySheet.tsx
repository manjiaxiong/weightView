import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type EntrySheetProps = {
  title: string
  open: boolean
  closeDisabled?: boolean
  onClose: () => void
  children: ReactNode
}

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
  )
}

export function EntrySheet({ title, open, closeDisabled = false, onClose, children }: EntrySheetProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const dialog = dialogRef.current
    const [firstFocusable] = dialog ? getFocusableElements(dialog) : []
    const initialFocusTarget = firstFocusable ?? dialog
    initialFocusTarget?.focus()

    return () => {
      const previousActiveElement = previousActiveElementRef.current
      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus()
      }
      previousActiveElementRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (closeDisabled) {
          return
        }
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current
      if (!dialog) {
        return
      }

      const focusableElements = getFocusableElements(dialog)
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

      if (currentIndex === -1) {
        event.preventDefault()
        const focusTarget = event.shiftKey ? lastFocusable : firstFocusable
        focusTarget.focus()
        return
      }

      event.preventDefault()
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
        : (currentIndex + 1) % focusableElements.length
      focusableElements[nextIndex].focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeDisabled, onClose, open])

  if (!open) {
    return null
  }

  function handleClose() {
    if (!closeDisabled) {
      onClose()
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={handleClose}>
      <section
        ref={dialogRef}
        className="entry-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Close"
            disabled={closeDisabled}
            onClick={handleClose}
          >
            x
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
