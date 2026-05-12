import { compareIsoDateDesc, normalizeIsoDate } from './date'
import { DEFAULT_MEDICINE_NAME } from './types'
import type { InjectionRecord, IsoDate } from './types'

type InjectionInput = {
  date: IsoDate
  medicineName?: string
  dose?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function createId(date: IsoDate): string {
  return `injection-${date}`
}

export function sortInjectionRecords(records: InjectionRecord[]): InjectionRecord[] {
  return [...records].sort((a, b) => compareIsoDateDesc(a.date, b.date))
}

export function upsertInjectionRecord(records: InjectionRecord[], input: InjectionInput): InjectionRecord[] {
  const date = normalizeIsoDate(input.date)
  const medicineName = input.medicineName?.trim() || DEFAULT_MEDICINE_NAME
  const dose = input.dose?.trim() || undefined
  const existing = records.find((record) => record.date === date)
  const timestamp = nowIso()
  const nextRecord: InjectionRecord = existing
    ? { ...existing, medicineName, dose, updatedAt: timestamp }
    : { id: createId(date), date, medicineName, dose, createdAt: timestamp, updatedAt: timestamp }

  return sortInjectionRecords([...records.filter((record) => record.date !== date), nextRecord])
}

export function deleteInjectionRecord(records: InjectionRecord[], id: string): InjectionRecord[] {
  return records.filter((record) => record.id !== id)
}

export function getLatestInjection(records: InjectionRecord[]): InjectionRecord | undefined {
  return sortInjectionRecords(records)[0]
}
