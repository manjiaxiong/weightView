import { sortInjectionRecords } from '../domain/injection'
import { sortWeightRecords } from '../domain/weight'
import type { AppData, InjectionRecord, WeightRecord } from '../domain/types'
import { migrateAppData } from './migrationService'

export type BackupPayload = {
  exportedAt: string
  data: AppData
}

export function buildExportPayload(data: AppData, exportedAt = new Date().toISOString()): BackupPayload {
  return {
    exportedAt,
    data
  }
}

export function buildExportJson(data: AppData): string {
  return JSON.stringify(buildExportPayload(data), null, 2)
}

export function importBackupJson(current: AppData, json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Backup file is not valid JSON')
  }

  if (!isValidBackupPayload(parsed)) {
    throw new Error('Backup file is not a valid Weight View backup')
  }

  const imported = migrateAppData(parsed.data, { strictRecords: true })

  return {
    ...current,
    schemaVersion: imported.schemaVersion,
    records: {
      weights: mergeByDate(current.records.weights, imported.records.weights, sortWeightRecords),
      injections: mergeByDate(current.records.injections, imported.records.injections, sortInjectionRecords)
    },
    settings: imported.settings
  }
}

function isValidBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const payload = value as Partial<BackupPayload>
  return (
    isValidExportedAt(payload.exportedAt) &&
    isValidBackupDataEnvelope(payload.data)
  )
}

function isValidExportedAt(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value))
}

function isValidBackupDataEnvelope(value: unknown): value is AppData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const data = value as Partial<AppData>
  return (
    typeof data.schemaVersion === 'number' &&
    !!data.records &&
    typeof data.records === 'object' &&
    !Array.isArray(data.records) &&
    Array.isArray(data.records.weights) &&
    Array.isArray(data.records.injections) &&
    !!data.settings &&
    typeof data.settings === 'object' &&
    !Array.isArray(data.settings)
  )
}

function mergeByDate<T extends WeightRecord | InjectionRecord>(
  localRecords: T[],
  importedRecords: T[],
  sortRecords: (records: T[]) => T[]
): T[] {
  const byDate = new Map<string, T>()
  for (const record of localRecords) {
    byDate.set(record.date, record)
  }
  for (const record of importedRecords) {
    byDate.set(record.date, record)
  }
  return sortRecords([...byDate.values()])
}
