import { describe, expect, it } from 'vitest'
import { buildExportPayload, importBackupJson } from './backupService'
import { createEmptyAppData } from './migrationService'

describe('backupService', () => {
  it('builds export payload with timestamp and app data', () => {
    const payload = buildExportPayload(createEmptyAppData(), '2026-05-12T00:00:00.000Z')
    expect(payload.exportedAt).toBe('2026-05-12T00:00:00.000Z')
    expect(payload.data.schemaVersion).toBe(1)
  })

  it('imports valid backup JSON', () => {
    const source = createEmptyAppData()
    source.records.weights.push({ id: 'w1', date: '2026-05-12', weight: 80, createdAt: 'a', updatedAt: 'b' })
    const json = JSON.stringify(buildExportPayload(source, '2026-05-12T00:00:00.000Z'))
    const merged = importBackupJson(createEmptyAppData(), json)
    expect(merged.records.weights).toHaveLength(1)
  })

  it('uses imported same-date records over local records', () => {
    const local = createEmptyAppData()
    local.records.weights.push({ id: 'local', date: '2026-05-12', weight: 81, createdAt: 'a', updatedAt: 'b' })

    const imported = createEmptyAppData()
    imported.records.weights.push({ id: 'imported', date: '2026-05-12', weight: 79, createdAt: 'c', updatedAt: 'd' })

    const merged = importBackupJson(local, JSON.stringify(buildExportPayload(imported, '2026-05-12T00:00:00.000Z')))
    expect(merged.records.weights).toEqual([{ id: 'imported', date: '2026-05-12', weight: 79, createdAt: 'c', updatedAt: 'd' }])
  })

  it('rejects invalid JSON without returning partial data', () => {
    expect(() => importBackupJson(createEmptyAppData(), '{bad json')).toThrow('Backup file is not valid JSON')
  })

  it('rejects missing backup envelope data', () => {
    expect(() => importBackupJson(createEmptyAppData(), '{}')).toThrow('Backup file is not a valid Weight View backup')
  })

  it('rejects null backup data', () => {
    expect(() => importBackupJson(createEmptyAppData(), '{ "data": null }')).toThrow(
      'Backup file is not a valid Weight View backup'
    )
  })

  it('rejects missing exportedAt backup metadata', () => {
    expect(() => importBackupJson(createEmptyAppData(), JSON.stringify({ data: createEmptyAppData() }))).toThrow(
      'Backup file is not a valid Weight View backup'
    )
  })

  it('rejects invalid imported weight data without overwriting local records', () => {
    const local = createEmptyAppData()
    local.records.weights.push({ id: 'local', date: '2026-05-12', weight: 81, createdAt: 'a', updatedAt: 'b' })
    const json = JSON.stringify({
      exportedAt: '2026-05-12T00:00:00.000Z',
      data: {
        schemaVersion: 1,
        records: {
          weights: [{ id: 'imported', date: '2026-05-12', weight: -1, createdAt: 'c', updatedAt: 'd' }],
          injections: []
        },
        settings: { unit: 'kg', defaultMedicineName: 'Tirzepatide' }
      }
    })

    expect(() => importBackupJson(local, json)).toThrow('Backup contains invalid record data')
    expect(local.records.weights).toEqual([{ id: 'local', date: '2026-05-12', weight: 81, createdAt: 'a', updatedAt: 'b' }])
  })

  it('rejects imported records with missing required fields', () => {
    const json = JSON.stringify({
      exportedAt: '2026-05-12T00:00:00.000Z',
      data: {
        schemaVersion: 1,
        records: {
          weights: [{ date: '2026-05-12', weight: 80 }],
          injections: []
        },
        settings: { unit: 'kg', defaultMedicineName: 'Tirzepatide' }
      }
    })

    expect(() => importBackupJson(createEmptyAppData(), json)).toThrow('Backup contains invalid record data')
  })
})
