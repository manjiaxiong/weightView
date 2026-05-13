import { describe, expect, it } from 'vitest'
import { createEmptyAppData, migrateAppData } from './migrationService'

describe('migrationService', () => {
  it('creates empty schema version 1 data', () => {
    expect(createEmptyAppData()).toMatchObject({
      schemaVersion: 1,
      records: { weights: [], injections: [] },
      settings: { unit: 'kg', defaultMedicineName: 'Tirzepatide' }
    })
  })

  it('accepts complete schema version 1 data', () => {
    const data = createEmptyAppData()
    expect(migrateAppData(data)).toEqual(data)
  })

  it('repairs missing version 1 collections without losing existing records', () => {
    const migrated = migrateAppData({
      schemaVersion: 1,
      records: {
        weights: [{ id: 'w', date: '2026-05-12', weight: 80, createdAt: 'a', updatedAt: 'b' }]
      },
      settings: { unit: 'kg' }
    })

    expect(migrated.records.weights).toHaveLength(1)
    expect(migrated.records.injections).toEqual([])
    expect(migrated.settings.defaultMedicineName).toBe('Tirzepatide')
  })

  it('preserves valid target weight settings', () => {
    const migrated = migrateAppData({
      schemaVersion: 1,
      records: { weights: [], injections: [] },
      settings: { unit: 'kg', defaultMedicineName: 'Tirzepatide', targetWeight: 70 }
    })

    expect(migrated.settings.targetWeight).toBe(70)
  })

  it('ignores invalid target weight settings', () => {
    for (const targetWeight of [0, -1, Number.NaN, '70']) {
      const migrated = migrateAppData({
        schemaVersion: 1,
        records: { weights: [], injections: [] },
        settings: { unit: 'kg', defaultMedicineName: 'Tirzepatide', targetWeight }
      })

      expect(migrated.settings.targetWeight).toBeUndefined()
    }
  })

  it('rejects unsupported future schema versions', () => {
    expect(() => migrateAppData({ schemaVersion: 99 })).toThrow('不支持的数据版本：99')
  })

  it('filters malformed stored records during migration', () => {
    const migrated = migrateAppData({
      schemaVersion: 1,
      records: {
        weights: [
          { id: 'valid', date: '2026-05-12', weight: 80, createdAt: 'a', updatedAt: 'b' },
          { id: 'invalid', date: '2026-05-13', weight: -1, createdAt: 'c', updatedAt: 'd' }
        ],
        injections: [{ id: 'bad-injection', date: '2026-05-12', medicineName: '', createdAt: 'a', updatedAt: 'b' }]
      },
      settings: { unit: 'kg' }
    })

    expect(migrated.records.weights).toEqual([{ id: 'valid', date: '2026-05-12', weight: 80, createdAt: 'a', updatedAt: 'b' }])
    expect(migrated.records.injections).toEqual([])
  })
})
