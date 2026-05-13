import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { EntrySheet } from './EntrySheet'

function StatefulSheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <EntrySheet title="Entry" open={open} onClose={() => setOpen(false)}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </EntrySheet>
    </>
  )
}

describe('EntrySheet', () => {
  it('moves focus into the dialog and restores focus after close', () => {
    render(<StatefulSheet />)

    const openButton = screen.getByRole('button', { name: 'Open sheet' })
    openButton.focus()
    fireEvent.click(openButton)

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(openButton).toHaveFocus()
  })

  it('traps tab focus inside the dialog', () => {
    render(
      <EntrySheet title="Entry" open onClose={vi.fn()}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </EntrySheet>
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    const firstAction = screen.getByRole('button', { name: 'First action' })
    const lastAction = screen.getByRole('button', { name: 'Last action' })

    closeButton.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(lastAction).toHaveFocus()

    lastAction.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(closeButton).toHaveFocus()

    firstAction.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(closeButton).toHaveFocus()
  })

  it('does not close by button, backdrop, or Escape while close is disabled', () => {
    const onClose = vi.fn()
    render(
      <EntrySheet title="Entry" open closeDisabled={true} onClose={onClose}>
        <button type="button">First action</button>
      </EntrySheet>
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    expect(closeButton).toBeDisabled()

    fireEvent.click(closeButton)
    fireEvent.click(screen.getByRole('presentation'))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })
})
