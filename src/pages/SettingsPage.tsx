import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import type { useAppData } from '../app/useAppData'
import { buildExportJson, importBackupJson } from '../services/backupService'

type PageProps = {
  appData: ReturnType<typeof useAppData>
}

export function SettingsPage({ appData }: PageProps) {
  const data = appData.data
  const [targetWeight, setTargetWeight] = useState('')

  useEffect(() => {
    setTargetWeight(data?.settings.targetWeight ? String(data.settings.targetWeight) : '')
  }, [data?.settings.targetWeight])

  async function saveTargetWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = targetWeight.trim()
    if (!trimmed) {
      await appData.actions.saveSettings({ targetWeight: undefined })
      return
    }

    const nextTargetWeight = Number(trimmed)
    if (!Number.isFinite(nextTargetWeight) || nextTargetWeight <= 0) {
      window.alert('目标体重必须大于 0')
      return
    }

    await appData.actions.saveSettings({ targetWeight: nextTargetWeight })
  }

  async function clearTargetWeight() {
    setTargetWeight('')
    await appData.actions.saveSettings({ targetWeight: undefined })
  }

  async function exportJson() {
    if (!data) return
    const backupJson = buildExportJson(data)
    const fileName = `weight-view-backup-${new Date().toISOString().slice(0, 10)}.json`

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: backupJson,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        })

        await Share.share({
          title: '体重管理备份',
          text: '体重管理 JSON 备份文件',
          url: result.uri,
          dialogTitle: '导出备份'
        })
        return
      }

      exportJsonInBrowser(backupJson, fileName)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导出失败')
    }
  }

  function exportJsonInBrowser(backupJson: string, fileName: string) {
    const blob = new Blob([backupJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    if (!data) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    const confirmed = window.confirm('导入将合并记录，相同日期的导入记录会覆盖本地记录。是否继续？')
    if (!confirmed) {
      return
    }

    try {
      const text = await readFileText(file)
      await appData.actions.replaceData(importBackupJson(data, text))
      window.alert('导入完成')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导入失败')
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>设置</h1>
      </header>

      <section className="settings-panel">
        <h2>目标体重</h2>
        <form className="settings-form" onSubmit={saveTargetWeight}>
          <label>
            目标体重 (kg)
            <input
              type="number"
              value={targetWeight}
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="例如 70"
              onChange={(event) => setTargetWeight(event.target.value)}
            />
          </label>
          <div className="settings-actions">
            <button className="primary-button" type="submit">保存目标</button>
            <button className="secondary-button" type="button" onClick={() => void clearTargetWeight()}>清除目标</button>
          </div>
        </form>
      </section>

      <section className="settings-panel">
        <h2>备份</h2>
        <button className="primary-button" type="button" onClick={() => void exportJson()}>导出 JSON</button>
        <label className="file-button">
          导入 JSON
          <input type="file" accept="application/json,.json" onChange={importJson} />
        </label>
      </section>

      <section className="settings-panel">
        <h2>数据</h2>
        <p>数据版本：{data?.schemaVersion ?? '-'}</p>
        <p>卸载应用可能导致本地数据丢失。更换手机或重新安装前，请先导出 JSON 备份。</p>
      </section>
    </section>
  )
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('读取备份文件失败'))
    reader.readAsText(file)
  })
}
