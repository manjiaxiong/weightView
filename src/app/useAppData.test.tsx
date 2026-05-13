import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppData } from '../domain/types'
import { createEmptyAppData } from '../services/migrationService'

const storageMocks = vi.hoisted(() => ({
  loadAppData: vi.fn(),
  saveAppData: vi.fn()
}))

vi.mock('../services/storageService', () => storageMocks)

import { useAppData } from './useAppData'

function cloneData(data: AppData): AppData {
  return structuredClone(data)
}

describe('useAppData', () => {
  beforeEach(() => {
    storageMocks.loadAppData.mockReset()
    storageMocks.saveAppData.mockReset()
    storageMocks.loadAppData.mockResolvedValue(createEmptyAppData())
    storageMocks.saveAppData.mockResolvedValue(undefined)
  })

  it('surfaces startup load failures through loadState', async () => {
    storageMocks.loadAppData.mockRejectedValueOnce(new Error('load failed'))

    const { result } = renderHook(() => useAppData())

    await waitFor(() => expect(result.current.loadState).toBe('error'))
    expect(result.current.error).toBe('load failed')
  })

  it('keeps app data ready when saving fails', async () => {
    storageMocks.saveAppData.mockRejectedValueOnce(new Error('disk full'))
    const { result } = renderHook(() => useAppData())

    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    let caught: unknown
    await act(async () => {
      try {
        await result.current.actions.saveWeight({ date: '2026-05-12', weight: 80 })
      } catch (error) {
        caught = error
      }
    })

    expect(caught).toBeInstanceOf(Error)
    expect(result.current.loadState).toBe('ready')
    expect(result.current.saveError).toBe('保存数据失败')
    expect(result.current.weights).toHaveLength(1)
  })

  it('persists action updates to storage', async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    await act(async () => {
      await result.current.actions.saveWeight({ date: '2026-05-12', weight: 80 })
    })

    expect(storageMocks.saveAppData).toHaveBeenCalledTimes(1)
    expect(storageMocks.saveAppData.mock.calls[0][0].records.weights).toMatchObject([
      { date: '2026-05-12', weight: 80 }
    ])
  })

  it('persists settings updates to storage', async () => {
    const { result } = renderHook(() => useAppData())

    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    await act(async () => {
      await result.current.actions.saveSettings({ targetWeight: 70 })
    })

    expect(storageMocks.saveAppData).toHaveBeenCalledTimes(1)
    expect(storageMocks.saveAppData.mock.calls[0][0].settings.targetWeight).toBe(70)
  })

  it('queues rapid writes and persists the final intended state', async () => {
    const savedSnapshots: AppData[] = []
    storageMocks.saveAppData.mockImplementation(async (data: AppData) => {
      savedSnapshots.push(cloneData(data))
    })
    const { result } = renderHook(() => useAppData())

    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    await act(async () => {
      await Promise.all([
        result.current.actions.saveWeight({ date: '2026-05-12', weight: 80 }),
        result.current.actions.saveWeight({ date: '2026-05-13', weight: 79 })
      ])
    })

    expect(storageMocks.saveAppData).toHaveBeenCalledTimes(2)
    expect(savedSnapshots.at(-1)?.records.weights).toMatchObject([
      { date: '2026-05-13', weight: 79 },
      { date: '2026-05-12', weight: 80 }
    ])
    expect(result.current.weights).toMatchObject([
      { date: '2026-05-13', weight: 79 },
      { date: '2026-05-12', weight: 80 }
    ])
  })
})
