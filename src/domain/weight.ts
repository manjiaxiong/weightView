import { compareIsoDateDesc, normalizeIsoDate } from './date'
import type { IsoDate, WeightRecord } from './types'

type WeightInput = {
  date: IsoDate
  weight: number
}

function nowIso(): string {
  return new Date().toISOString()
}

function createId(date: IsoDate): string {
  return `weight-${date}`
}

export function sortWeightRecords(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort((a, b) => compareIsoDateDesc(a.date, b.date))
}

export function upsertWeightRecord(records: WeightRecord[], input: WeightInput): WeightRecord[] {
  const date = normalizeIsoDate(input.date)
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    throw new Error('Weight must be a positive number')
  }

  const existing = records.find((record) => record.date === date)
  const timestamp = nowIso()
  const nextRecord: WeightRecord = existing
    ? { ...existing, weight: input.weight, updatedAt: timestamp }
    : { id: createId(date), date, weight: input.weight, createdAt: timestamp, updatedAt: timestamp }

  return sortWeightRecords([...records.filter((record) => record.date !== date), nextRecord])
}

export function deleteWeightRecord(records: WeightRecord[], id: string): WeightRecord[] {
  return records.filter((record) => record.id !== id)
}

export function getLatestWeight(records: WeightRecord[]): WeightRecord | undefined {
  return sortWeightRecords(records)[0]
}

export function getWeightDelta(records: WeightRecord[]): number | undefined {
  const sorted = sortWeightRecords(records)
  if (sorted.length < 2) {
    return undefined
  }
  return sorted[0].weight - sorted[1].weight
}
