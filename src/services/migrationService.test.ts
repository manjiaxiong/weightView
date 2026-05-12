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

  it('rejects unsupported future schema versions', () => {
    expect(() => migrateAppData({ schemaVersion: 99 })).toThrow('Unsupported data schema version: 99')
  })
})
