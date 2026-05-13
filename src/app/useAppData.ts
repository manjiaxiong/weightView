import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { deleteInjectionRecord, upsertInjectionRecord } from '../domain/injection'
import type { AppData, AppSettings, InjectionRecord, IsoDate, WeightRecord } from '../domain/types'
import { deleteWeightRecord, upsertWeightRecord } from '../domain/weight'
import { loadAppData, saveAppData } from '../services/storageService'

type LoadState = 'loading' | 'ready' | 'error'

type WeightInput = {
  date: IsoDate
  weight: number
}

type InjectionInput = {
  date: IsoDate
  medicineName?: string
  dose?: string
}

type AppDataActions = {
  saveWeight: (input: WeightInput) => Promise<void>
  removeWeight: (id: string) => Promise<void>
  saveInjection: (input: InjectionInput) => Promise<void>
  removeInjection: (id: string) => Promise<void>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  replaceData: (nextData: AppData) => Promise<void>
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '无法加载数据'
}

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dataRef = useRef<AppData | null>(null)
  const persistQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    let isActive = true

    loadAppData()
      .then((loadedData) => {
        if (!isActive) {
          return
        }
        dataRef.current = loadedData
        setData(loadedData)
        setError(null)
        setLoadState('ready')
      })
      .catch((loadError: unknown) => {
        if (!isActive) {
          return
        }
        setError(getErrorMessage(loadError))
        setLoadState('error')
      })

    return () => {
      isActive = false
    }
  }, [])

  const persistNextData = useCallback(async (nextData: AppData) => {
    dataRef.current = nextData
    setData(nextData)
    setSaveError(null)

    const persistTask = persistQueueRef.current
      .catch(() => undefined)
      .then(() => saveAppData(nextData))

    persistQueueRef.current = persistTask.catch(() => undefined)

    try {
      await persistTask
    } catch (persistError) {
      setSaveError('保存数据失败')
      throw persistError
    }
  }, [])

  const updateData = useCallback(
    (updater: (current: AppData) => AppData) => {
      const current = dataRef.current
      if (!current) {
        return Promise.resolve()
      }

      return persistNextData(updater(current))
    },
    [persistNextData]
  )

  const actions = useMemo<AppDataActions>(
    () => ({
      saveWeight: (input) =>
        updateData((current) => ({
          ...current,
          records: {
            ...current.records,
            weights: upsertWeightRecord(current.records.weights, input)
          }
        })),
      removeWeight: (id) =>
        updateData((current) => ({
          ...current,
          records: {
            ...current.records,
            weights: deleteWeightRecord(current.records.weights, id)
          }
        })),
      saveInjection: (input) =>
        updateData((current) => ({
          ...current,
          records: {
            ...current.records,
            injections: upsertInjectionRecord(current.records.injections, input)
          }
        })),
      removeInjection: (id) =>
        updateData((current) => ({
          ...current,
          records: {
            ...current.records,
            injections: deleteInjectionRecord(current.records.injections, id)
          }
        })),
      saveSettings: (settings) =>
        updateData((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ...settings
          }
        })),
      replaceData: persistNextData
    }),
    [persistNextData, updateData]
  )

  return {
    data,
    loadState,
    error,
    saveError,
    weights: data?.records.weights ?? ([] as WeightRecord[]),
    injections: data?.records.injections ?? ([] as InjectionRecord[]),
    actions
  }
}
