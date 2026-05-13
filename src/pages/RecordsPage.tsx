import { useState } from 'react'

import type { useAppData } from '../app/useAppData'
import { InjectionEntrySheet } from '../components/InjectionEntrySheet'
import { WeightEntrySheet } from '../components/WeightEntrySheet'

type PageProps = {
  appData: ReturnType<typeof useAppData>
}

type CombinedRecord =
  | { type: 'weight'; id: string; date: string; label: string; detail: string }
  | { type: 'injection'; id: string; date: string; label: string; detail: string }

type EditingRecord = { type: 'weight'; id: string } | { type: 'injection'; id: string } | null

export function RecordsPage({ appData }: PageProps) {
  const [editingRecord, setEditingRecord] = useState<EditingRecord>(null)
  const records: CombinedRecord[] = [
    ...appData.weights.map((record) => ({
      type: 'weight' as const,
      id: record.id,
      date: record.date,
      label: `${record.weight.toFixed(1)} kg`,
      detail: '体重'
    })),
    ...appData.injections.map((record) => ({
      type: 'injection' as const,
      id: record.id,
      date: record.date,
      label: record.medicineName,
      detail: record.dose ? `注射 ${record.dose}` : '注射'
    }))
  ].sort((a, b) => b.date.localeCompare(a.date))

  const selectedWeight = editingRecord?.type === 'weight'
    ? appData.weights.find((record) => record.id === editingRecord.id)
    : undefined
  const selectedInjection = editingRecord?.type === 'injection'
    ? appData.injections.find((record) => record.id === editingRecord.id)
    : undefined

  function deleteRecord(record: CombinedRecord) {
    const confirmed = window.confirm(`确定删除 ${record.date} 的${record.type === 'weight' ? '体重' : '注射'}记录吗？`)
    if (!confirmed) {
      return
    }

    if (record.type === 'weight') {
      void appData.actions.removeWeight(record.id)
    } else {
      void appData.actions.removeInjection(record.id)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>记录</h1>
      </header>
      <div className="record-list">
        {records.length === 0 && <p className="empty-state">暂无记录</p>}
        {records.map((record) => (
          <article className="record-row" key={`${record.type}-${record.id}`}>
            <div>
              <strong>{record.label}</strong>
              <span>{record.detail}</span>
            </div>
            <div className="record-meta">
              <time>{record.date}</time>
              <div className="record-actions">
                <button
                  className="secondary-button compact"
                  type="button"
                  onClick={() => setEditingRecord({ type: record.type, id: record.id })}
                >
                  编辑
                </button>
                <button className="danger-button" type="button" onClick={() => deleteRecord(record)}>
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <WeightEntrySheet
        open={editingRecord?.type === 'weight'}
        record={selectedWeight}
        onClose={() => setEditingRecord(null)}
        onSave={appData.actions.saveWeight}
      />
      <InjectionEntrySheet
        open={editingRecord?.type === 'injection'}
        record={selectedInjection}
        onClose={() => setEditingRecord(null)}
        onSave={appData.actions.saveInjection}
      />
    </section>
  )
}
