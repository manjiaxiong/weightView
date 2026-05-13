import { sortInjectionRecords } from '../domain/injection'
import { normalizeIsoDate } from '../domain/date'
import { CURRENT_SCHEMA_VERSION, DEFAULT_MEDICINE_NAME } from '../domain/types'
import { sortWeightRecords } from '../domain/weight'
import type { AppData, InjectionRecord, WeightRecord } from '../domain/types'

type UnknownData = Partial<AppData> & {
  schemaVersion?: number
  records?: {
    weights?: unknown
    injections?: unknown
  }
  settings?: Partial<AppData['settings']>
}

type MigrationOptions = {
  strictRecords?: boolean
}

const INVALID_RECORD_DATA_ERROR = '备份数据包含无效记录'

export function createEmptyAppData(): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    records: {
      weights: [],
      injections: []
    },
    settings: {
      unit: 'kg',
      defaultMedicineName: DEFAULT_MEDICINE_NAME
    }
  }
}

export function migrateAppData(raw: unknown, options: MigrationOptions = {}): AppData {
  if (!raw || typeof raw !== 'object') {
    return createEmptyAppData()
  }

  const data = raw as UnknownData
  if (data.schemaVersion && data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`不支持的数据版本：${data.schemaVersion}`)
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    records: {
      weights: sortWeightRecords(readValidWeightRecords(data.records?.weights, options.strictRecords === true)),
      injections: sortInjectionRecords(readValidInjectionRecords(data.records?.injections, options.strictRecords === true))
    },
    settings: {
      unit: 'kg',
      defaultMedicineName: data.settings?.defaultMedicineName || DEFAULT_MEDICINE_NAME,
      targetWeight: readTargetWeight(data.settings?.targetWeight)
    }
  }
}

function readTargetWeight(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function readValidWeightRecords(value: unknown, strict: boolean): WeightRecord[] {
  if (!Array.isArray(value)) {
    if (strict && value !== undefined) {
      throw new Error(INVALID_RECORD_DATA_ERROR)
    }
    return []
  }

  const records: WeightRecord[] = []
  for (const record of value) {
    if (!isValidWeightRecord(record)) {
      if (strict) {
        throw new Error(INVALID_RECORD_DATA_ERROR)
      }
      continue
    }
    records.push(record)
  }
  return records
}

function readValidInjectionRecords(value: unknown, strict: boolean): InjectionRecord[] {
  if (!Array.isArray(value)) {
    if (strict && value !== undefined) {
      throw new Error(INVALID_RECORD_DATA_ERROR)
    }
    return []
  }

  const records: InjectionRecord[] = []
  for (const record of value) {
    if (!isValidInjectionRecord(record)) {
      if (strict) {
        throw new Error(INVALID_RECORD_DATA_ERROR)
      }
      continue
    }
    records.push(record)
  }
  return records
}

function isValidWeightRecord(record: unknown): record is WeightRecord {
  if (!isRecordObject(record)) {
    return false
  }

  return (
    isNonEmptyString(record.id) &&
    isValidIsoDate(record.date) &&
    typeof record.weight === 'number' &&
    Number.isFinite(record.weight) &&
    record.weight > 0 &&
    isNonEmptyString(record.createdAt) &&
    isNonEmptyString(record.updatedAt)
  )
}

function isValidInjectionRecord(record: unknown): record is InjectionRecord {
  if (!isRecordObject(record)) {
    return false
  }

  return (
    isNonEmptyString(record.id) &&
    isValidIsoDate(record.date) &&
    isNonEmptyString(record.medicineName) &&
    isNonEmptyString(record.createdAt) &&
    isNonEmptyString(record.updatedAt) &&
    (record.dose === undefined || typeof record.dose === 'string')
  )
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  try {
    normalizeIsoDate(value)
    return true
  } catch {
    return false
  }
}
