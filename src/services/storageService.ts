import localforage from 'localforage'

import type { AppData } from '../domain/types'
import { createEmptyAppData, migrateAppData } from './migrationService'

const APP_DATA_KEY = 'weight-view:app-data'

localforage.config({
  name: 'WeightView',
  storeName: 'app_data',
  description: 'Offline weight and injection tracking data'
})

export async function loadAppData(): Promise<AppData> {
  const raw = await localforage.getItem(APP_DATA_KEY)
  if (!raw) {
    return createEmptyAppData()
  }
  return migrateAppData(raw)
}

export async function saveAppData(data: AppData): Promise<void> {
  await localforage.setItem(APP_DATA_KEY, data)
}
