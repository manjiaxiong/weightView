import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { useAppData } from '../app/useAppData'
import type { AppData } from '../domain/types'
import { buildExportJson } from '../services/backupService'
import { createEmptyAppData } from '../services/migrationService'
import { SettingsPage } from './SettingsPage'

const capacitorMocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn()
}))

const filesystemMocks = vi.hoisted(() => ({
  writeFile: vi.fn()
}))

const shareMocks = vi.hoisted(() => ({
  share: vi.fn()
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: capacitorMocks.isNativePlatform
  }
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: {
    Cache: 'CACHE'
  },
  Encoding: {
    UTF8: 'utf8'
  },
  Filesystem: {
    writeFile: filesystemMocks.writeFile
  }
}))

vi.mock('@capacitor/share', () => ({
  Share: {
    share: shareMocks.share
  }
}))

function createAppData(
  overrides: Partial<ReturnType<typeof useAppData>> = {}
): ReturnType<typeof useAppData> {
  const data = createEmptyAppData()

  return {
    data,
    loadState: 'ready',
    error: null,
    saveError: null,
    weights: data.records.weights,
    injections: data.records.injections,
    actions: {
      saveWeight: vi.fn(async () => undefined),
      removeWeight: vi.fn(async () => undefined),
      saveInjection: vi.fn(async () => undefined),
      removeInjection: vi.fn(async () => undefined),
      saveSettings: vi.fn(async () => undefined),
      replaceData: vi.fn(async () => undefined)
    },
    ...overrides
  }
}

describe('SettingsPage', () => {
  beforeEach(() => {
    capacitorMocks.isNativePlatform.mockReset()
    filesystemMocks.writeFile.mockReset()
    shareMocks.share.mockReset()
    filesystemMocks.writeFile.mockResolvedValue({ uri: 'file:///cache/weight-view-backup.json' })
    shareMocks.share.mockResolvedValue(undefined)
  })

  it('saves and clears target weight settings', async () => {
    const saveSettings = vi.fn(async () => undefined)

    render(
      <SettingsPage
        appData={createAppData({
          actions: {
            ...createAppData().actions,
            saveSettings
          }
        })}
      />
    )

    fireEvent.change(screen.getByLabelText('目标体重 (kg)'), { target: { value: '70.5' } })
    fireEvent.click(screen.getByRole('button', { name: '保存目标' }))

    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith({ targetWeight: 70.5 }))

    fireEvent.click(screen.getByRole('button', { name: '清除目标' }))

    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith({ targetWeight: undefined }))
  })

  it('exports backups through native file sharing on Android', async () => {
    capacitorMocks.isNativePlatform.mockReturnValue(true)

    render(<SettingsPage appData={createAppData()} />)

    fireEvent.click(screen.getByRole('button', { name: '导出 JSON' }))

    await waitFor(() => expect(filesystemMocks.writeFile).toHaveBeenCalledTimes(1))
    const writeCall = filesystemMocks.writeFile.mock.calls[0][0]
    expect(writeCall.directory).toBe('CACHE')
    expect(writeCall.encoding).toBe('utf8')
    expect(writeCall.path).toMatch(/^weight-view-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(JSON.parse(writeCall.data).data.schemaVersion).toBe(1)

    expect(shareMocks.share).toHaveBeenCalledWith({
      title: '体重管理备份',
      text: '体重管理 JSON 备份文件',
      url: 'file:///cache/weight-view-backup.json',
      dialogTitle: '导出备份'
    })
  })

  it('imports valid backup JSON through replaceData', async () => {
    const replaceData = vi.fn(async (_nextData: AppData) => undefined)
    const imported = createEmptyAppData()
    imported.records.weights.push({
      id: 'weight-2026-05-12',
      date: '2026-05-12',
      weight: 80,
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z'
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => undefined)

    render(
      <SettingsPage
        appData={createAppData({
          actions: {
            ...createAppData().actions,
            replaceData
          }
        })}
      />
    )

    fireEvent.change(screen.getByLabelText('导入 JSON'), {
      target: {
        files: [new File([buildExportJson(imported)], 'backup.json', { type: 'application/json' })]
      }
    })

    await waitFor(() => expect(replaceData).toHaveBeenCalledTimes(1))
    expect(replaceData.mock.calls[0][0].records.weights).toMatchObject([
      { date: '2026-05-12', weight: 80 }
    ])
    expect(window.alert).toHaveBeenCalledWith('导入完成')
  })

  it('rejects invalid backup JSON without replacing local data', async () => {
    const replaceData = vi.fn(async (_nextData: AppData) => undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'alert').mockImplementation(() => undefined)

    render(
      <SettingsPage
        appData={createAppData({
          actions: {
            ...createAppData().actions,
            replaceData
          }
        })}
      />
    )

    fireEvent.change(screen.getByLabelText('导入 JSON'), {
      target: {
        files: [new File(['{bad json'], 'backup.json', { type: 'application/json' })]
      }
    })

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('备份文件不是有效的 JSON'))
    expect(replaceData).not.toHaveBeenCalled()
  })
})
