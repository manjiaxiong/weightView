import { describe, expect, it } from 'vitest'
import type { WeightRecord } from './types'
import { deleteWeightRecord, getLatestWeight, getWeightDelta, upsertWeightRecord } from './weight'

const baseRecords: WeightRecord[] = [
  { id: 'w1', date: '2026-05-10', weight: 80.2, createdAt: '2026-05-10T08:00:00.000Z', updatedAt: '2026-05-10T08:00:00.000Z' },
  { id: 'w2', date: '2026-05-12', weight: 79.6, createdAt: '2026-05-12T08:00:00.000Z', updatedAt: '2026-05-12T08:00:00.000Z' }
]

describe('weight domain', () => {
  it('inserts a new weight record sorted by date descending', () => {
    const result = upsertWeightRecord(baseRecords, { date: '2026-05-11', weight: 80 })
    expect(result.map((record) => record.date)).toEqual(['2026-05-12', '2026-05-11', '2026-05-10'])
  })

  it('updates the existing same-date weight record', () => {
    const result = upsertWeightRecord(baseRecords, { date: '2026-05-12', weight: 79.1 })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ date: '2026-05-12', weight: 79.1 })
    expect(result[0].id).toBe('w2')
  })

  it('deletes by id', () => {
    expect(deleteWeightRecord(baseRecords, 'w1').map((record) => record.id)).toEqual(['w2'])
  })

  it('returns latest weight and delta from previous record', () => {
    expect(getLatestWeight(baseRecords)?.weight).toBe(79.6)
    expect(getWeightDelta(baseRecords)).toBeCloseTo(-0.6)
  })
})
