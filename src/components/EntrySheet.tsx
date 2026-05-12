import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'

type EntrySheetProps = {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function EntrySheet({ title, open, onClose, children }: EntrySheetProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="entry-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}>
            x
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
