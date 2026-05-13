import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { WeightEntrySheet } from './WeightEntrySheet'

describe('WeightEntrySheet', () => {
  it('validates weight before saving', () => {
    const onSave = vi.fn()
    render(<WeightEntrySheet open initialDate="2026-05-13" onClose={vi.fn()} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '0' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save weight' }).closest('form')!)

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a weight greater than 0 kg.')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('resets fields and errors when opened', () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      const [initialDate, setInitialDate] = useState('2026-05-13')

      return (
        <>
          <button
            type="button"
            onClick={() => {
              setInitialDate('2026-05-14')
              setOpen(true)
            }}
          >
            Reopen
          </button>
          <WeightEntrySheet
            open={open}
            initialDate={initialDate}
            onClose={() => setOpen(false)}
            onSave={vi.fn()}
          />
        </>
      )
    }

    render(<Harness />)

    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '0' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Save weight' }).closest('form')!)
    expect(screen.getByRole('alert')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-14')
    expect(screen.getByLabelText('Weight (kg)')).toHaveValue(null)
  })

  it('keeps the sheet open and shows an inline error when async save fails', async () => {
    const onClose = vi.fn()
    const onSave = vi.fn(async () => {
      throw new Error('Scale service rejected the entry.')
    })

    render(<WeightEntrySheet open initialDate="2026-05-13" onClose={onClose} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '82.4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save weight' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Scale service rejected the entry.')
    expect(screen.getByRole('dialog', { name: 'Add weight' })).toBeVisible()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents closing while save is pending', async () => {
    let resolveSave: () => void = () => undefined
    const onClose = vi.fn()
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    render(<WeightEntrySheet open initialDate="2026-05-13" onClose={onClose} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '82.4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save weight' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('presentation'))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()

    resolveSave()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
