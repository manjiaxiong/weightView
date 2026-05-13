import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'

import { getTodayIsoDate } from '../domain/date'
import type { IsoDate, WeightRecord } from '../domain/types'
import { EntrySheet } from './EntrySheet'

type WeightEntryInput = {
  date: IsoDate
  weight: number
}

type WeightEntrySheetProps = {
  open: boolean
  record?: WeightRecord
  initialDate?: IsoDate
  onClose: () => void
  onSave: (input: WeightEntryInput) => Promise<void> | void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function WeightEntrySheet({ open, record, initialDate, onClose, onSave }: WeightEntrySheetProps) {
  const errorId = useId()
  const [date, setDate] = useState<IsoDate>(record?.date ?? initialDate ?? getTodayIsoDate())
  const [weight, setWeight] = useState(record ? String(record.weight) : '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setDate(record?.date ?? initialDate ?? getTodayIsoDate())
    setWeight(record ? String(record.weight) : '')
    setError(null)
    setIsSaving(false)
  }, [initialDate, open, record?.date, record?.weight])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextWeight = Number(weight)
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
      setError('Enter a weight greater than 0 kg.')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      await onSave({ date, weight: nextWeight })
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Unable to save weight.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EntrySheet title={record ? 'Edit weight' : 'Add weight'} open={open} closeDisabled={isSaving} onClose={onClose}>
      <form className="sheet-form" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={date} required onChange={(event) => setDate(event.target.value)} />
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            value={weight}
            min="0"
            step="0.1"
            inputMode="decimal"
            required
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>

        {error && (
          <p className="form-error" id={errorId} role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save weight'}
        </button>
      </form>
    </EntrySheet>
  )
}
