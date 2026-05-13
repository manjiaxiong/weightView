import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'

import { getTodayIsoDate } from '../domain/date'
import { DEFAULT_MEDICINE_NAME } from '../domain/types'
import type { InjectionRecord, IsoDate } from '../domain/types'
import { EntrySheet } from './EntrySheet'

type InjectionEntryInput = {
  date: IsoDate
  medicineName?: string
  dose?: string
}

type InjectionEntrySheetProps = {
  open: boolean
  record?: InjectionRecord
  initialDate?: IsoDate
  onClose: () => void
  onSave: (input: InjectionEntryInput) => Promise<void> | void
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function InjectionEntrySheet({ open, record, initialDate, onClose, onSave }: InjectionEntrySheetProps) {
  const errorId = useId()
  const [date, setDate] = useState<IsoDate>(record?.date ?? initialDate ?? getTodayIsoDate())
  const [medicineName, setMedicineName] = useState(record?.medicineName ?? DEFAULT_MEDICINE_NAME)
  const [dose, setDose] = useState(record?.dose ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setDate(record?.date ?? initialDate ?? getTodayIsoDate())
    setMedicineName(record?.medicineName ?? DEFAULT_MEDICINE_NAME)
    setDose(record?.dose ?? '')
    setError(null)
    setIsSaving(false)
  }, [initialDate, open, record?.date, record?.dose, record?.medicineName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      await onSave({
        date,
        medicineName: medicineName.trim() || DEFAULT_MEDICINE_NAME,
        dose: dose.trim() || undefined
      })
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Unable to save injection.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EntrySheet
      title={record ? 'Edit injection' : 'Add injection'}
      open={open}
      closeDisabled={isSaving}
      onClose={onClose}
    >
      <form className="sheet-form" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={date} required onChange={(event) => setDate(event.target.value)} />
        </label>

        <label>
          Medicine name
          <input
            type="text"
            value={medicineName}
            required
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setMedicineName(event.target.value)}
          />
        </label>

        <label>
          Dose
          <input
            type="text"
            value={dose}
            aria-describedby={error ? errorId : undefined}
            placeholder="Optional"
            onChange={(event) => setDose(event.target.value)}
          />
        </label>

        {error && (
          <p className="form-error" id={errorId} role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save injection'}
        </button>
      </form>
    </EntrySheet>
  )
}
