import { describe, expect, it } from 'vitest'
import type { InjectionRecord } from './types'
import { deleteInjectionRecord, getLatestInjection, upsertInjectionRecord } from './injection'

const baseRecords: InjectionRecord[] = [
  { id: 'i1', date: '2026-05-05', medicineName: 'Tirzepatide', dose: '2.5mg', createdAt: '2026-05-05T08:00:00.000Z', updatedAt: '2026-05-05T08:00:00.000Z' },
  { id: 'i2', date: '2026-05-12', medicineName: 'Tirzepatide', createdAt: '2026-05-12T08:00:00.000Z', updatedAt: '2026-05-12T08:00:00.000Z' }
]

describe('injection domain', () => {
  it('inserts a new injection record sorted by date descending', () => {
    const result = upsertInjectionRecord(baseRecords, { date: '2026-05-08', medicineName: 'Tirzepatide', dose: '2.5mg' })
    expect(result.map((record) => record.date)).toEqual(['2026-05-12', '2026-05-08', '2026-05-05'])
  })

  it('updates the existing same-date injection record', () => {
    const result = upsertInjectionRecord(baseRecords, { date: '2026-05-12', medicineName: 'Tirzepatide', dose: '5mg' })
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ date: '2026-05-12', dose: '5mg' })
    expect(result[0].id).toBe('i2')
  })

  it('deletes by id', () => {
    expect(deleteInjectionRecord(baseRecords, 'i1').map((record) => record.id)).toEqual(['i2'])
  })

  it('returns the latest injection', () => {
    expect(getLatestInjection(baseRecords)?.date).toBe('2026-05-12')
  })
})
