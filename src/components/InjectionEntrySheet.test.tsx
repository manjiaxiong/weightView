import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_MEDICINE_NAME } from '../domain/types'
import { InjectionEntrySheet } from './InjectionEntrySheet'

describe('InjectionEntrySheet', () => {
  it('uses the default medicine name when the entered medicine is blank', async () => {
    const onSave = vi.fn()
    render(<InjectionEntrySheet open initialDate="2026-05-13" onClose={vi.fn()} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Medicine name'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save injection' }))

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        date: '2026-05-13',
        medicineName: DEFAULT_MEDICINE_NAME,
        dose: undefined
      })
    )
  })

  it('resets fields and errors when opened', async () => {
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
          <InjectionEntrySheet
            open={open}
            initialDate={initialDate}
            onClose={() => setOpen(false)}
            onSave={vi.fn(async () => {
              throw new Error('Injection save failed.')
            })}
          />
        </>
      )
    }

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Save injection' }))
    expect(await screen.findByRole('alert')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reopen' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-14')
    expect(screen.getByLabelText('Medicine name')).toHaveValue(DEFAULT_MEDICINE_NAME)
    expect(screen.getByLabelText('Dose')).toHaveValue('')
  })

  it('keeps the sheet open and shows an inline error when async save fails', async () => {
    const onClose = vi.fn()
    const onSave = vi.fn(async () => {
      throw new Error('Injection service rejected the entry.')
    })

    render(<InjectionEntrySheet open initialDate="2026-05-13" onClose={onClose} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save injection' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Injection service rejected the entry.')
    expect(screen.getByRole('dialog', { name: 'Add injection' })).toBeVisible()
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

    render(<InjectionEntrySheet open initialDate="2026-05-13" onClose={onClose} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save injection' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('presentation'))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()

    resolveSave()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
