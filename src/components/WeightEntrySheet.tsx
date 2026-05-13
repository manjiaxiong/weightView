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
      setError('请输入大于 0 的体重')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      await onSave({ date, weight: nextWeight })
      onClose()
    } catch (saveError) {
      setError(getErrorMessage(saveError, '保存体重失败'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EntrySheet title={record ? '编辑体重' : '添加体重'} open={open} closeDisabled={isSaving} onClose={onClose}>
      <form className="sheet-form" onSubmit={handleSubmit}>
        <label>
          日期
          <input type="date" value={date} required onChange={(event) => setDate(event.target.value)} />
        </label>

        <label>
          体重 (kg)
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
          {isSaving ? '保存中...' : '保存体重'}
        </button>
      </form>
    </EntrySheet>
  )
}
