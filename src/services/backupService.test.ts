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
})
