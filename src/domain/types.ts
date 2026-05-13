export const CURRENT_SCHEMA_VERSION = 1 as const
export const DEFAULT_MEDICINE_NAME = 'Tirzepatide'

export type IsoDate = string
export type IsoDateTime = string

export type WeightRecord = {
  id: string
  date: IsoDate
  weight: number
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export type InjectionRecord = {
  id: string
  date: IsoDate
  medicineName: string
  dose?: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export type AppSettings = {
  unit: 'kg'
  defaultMedicineName: string
  targetWeight?: number
}

export type AppData = {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION
  records: {
    weights: WeightRecord[]
    injections: InjectionRecord[]
  }
  settings: AppSettings
}

export type CalendarDay = {
  date: IsoDate
  inCurrentMonth: boolean
}
