import { sortInjectionRecords } from '../domain/injection'
import { CURRENT_SCHEMA_VERSION, DEFAULT_MEDICINE_NAME } from '../domain/types'
import { sortWeightRecords } from '../domain/weight'
import type { AppData, InjectionRecord, WeightRecord } from '../domain/types'

type UnknownData = Partial<AppData> & {
  schemaVersion?: number
  records?: {
    weights?: WeightRecord[]
    injections?: InjectionRecord[]
  }
  settings?: Partial<AppData['settings']>
}

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

export function migrateAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') {
    return createEmptyAppData()
  }

  const data = raw as UnknownData
  if (data.schemaVersion && data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported data schema version: ${data.schemaVersion}`)
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    records: {
      weights: sortWeightRecords(Array.isArray(data.records?.weights) ? data.records.weights : []),
      injections: sortInjectionRecords(Array.isArray(data.records?.injections) ? data.records.injections : [])
    },
    settings: {
      unit: 'kg',
      defaultMedicineName: data.settings?.defaultMedicineName || DEFAULT_MEDICINE_NAME
    }
  }
}
