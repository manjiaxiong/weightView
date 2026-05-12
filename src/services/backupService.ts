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

  const payload = parsed as Partial<BackupPayload>
  const imported = migrateAppData(payload.data)

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
