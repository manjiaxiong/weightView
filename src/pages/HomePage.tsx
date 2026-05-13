import { Plus, Syringe } from 'lucide-react'
import { useState } from 'react'

import type { useAppData } from '../app/useAppData'
import { InjectionEntrySheet } from '../components/InjectionEntrySheet'
import { TrendChart } from '../components/TrendChart'
import { WeightEntrySheet } from '../components/WeightEntrySheet'
import { daysBetween, getTodayIsoDate } from '../domain/date'
import { getLatestInjection } from '../domain/injection'
import { getInitialWeightDelta, getLatestWeight, getWeightDelta } from '../domain/weight'

type HomePageProps = {
  appData: ReturnType<typeof useAppData>
}

type OpenSheet = 'weight' | 'injection' | null

function formatWeight(value: number | undefined): string {
  return value === undefined ? '--' : `${value.toFixed(1)} kg`
}

function formatDelta(value: number | undefined): string {
  if (value === undefined) {
    return '--'
  }

  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)} kg`
}

function formatInitialDelta(value: number | undefined): { label: string; value: string } {
  if (value === undefined) {
    return { label: '较初始变化', value: '--' }
  }

  if (value < 0) {
    return { label: '较初始减少', value: `${Math.abs(value).toFixed(1)} kg` }
  }

  if (value > 0) {
    return { label: '较初始增加', value: `${value.toFixed(1)} kg` }
  }

  return { label: '较初始持平', value: '0.0 kg' }
}

function formatDays(value: number | undefined): string {
  if (value === undefined) {
    return '--'
  }

  return value === 1 ? '1 天' : `${value} 天`
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function getTargetProgress(startWeight: number | undefined, latestWeight: number | undefined, targetWeight: number | undefined) {
  if (latestWeight === undefined || targetWeight === undefined) {
    return {
      summary: '在设置中添加目标体重后，这里会显示进度',
      progress: 0
    }
  }

  const difference = latestWeight - targetWeight
  const summary = difference > 0
    ? `距目标还差 ${difference.toFixed(1)} kg`
    : `已达到目标 ${Math.abs(difference).toFixed(1)} kg`

  if (startWeight === undefined || startWeight === targetWeight) {
    return { summary, progress: difference <= 0 ? 100 : 0 }
  }

  const progress = ((startWeight - latestWeight) / (startWeight - targetWeight)) * 100
  return { summary, progress: clampProgress(progress) }
}

export function HomePage({ appData }: HomePageProps) {
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null)
  const today = getTodayIsoDate()
  const latestWeight = getLatestWeight(appData.weights)
  const initialWeight = appData.weights.length > 0 ? [...appData.weights].sort((a, b) => a.date.localeCompare(b.date))[0] : undefined
  const targetWeight = appData.data?.settings.targetWeight
  const targetProgress = getTargetProgress(initialWeight?.weight, latestWeight?.weight, targetWeight)
  const weightDelta = getWeightDelta(appData.weights)
  const initialWeightDelta = formatInitialDelta(getInitialWeightDelta(appData.weights))
  const latestInjection = getLatestInjection(appData.injections)
  const daysSinceInjection = latestInjection ? daysBetween(latestInjection.date, today) : undefined

  return (
    <>
      <section className="page home-page">
        <header className="page-header">
          <p className="eyebrow">体重管理</p>
          <h1>首页</h1>
        </header>

        <section className="hero-panel" aria-label="体重概览">
          <div>
            <p className="eyebrow">最新体重</p>
            <p className="metric-value">{formatWeight(latestWeight?.weight)}</p>
          </div>
          <div>
            <p className="eyebrow">较上次变化</p>
            <p className="metric-value secondary">{formatDelta(weightDelta)}</p>
          </div>
          <div>
            <p className="eyebrow">{initialWeightDelta.label}</p>
            <p className="metric-value secondary">{initialWeightDelta.value}</p>
          </div>
        </section>

        <section className="target-panel" aria-label="目标体重">
          <div className="panel-heading">
            <p className="eyebrow">目标体重</p>
            <h2>{targetWeight ? `${targetWeight.toFixed(1)} kg` : '未设置'}</h2>
          </div>
          <p className="target-summary">{targetProgress.summary}</p>
          <div className="progress-track" aria-label="目标进度">
            <span style={{ width: `${targetProgress.progress}%` }} />
          </div>
        </section>

        <div className="quick-grid" aria-label="快速录入">
          <button className="primary-button" type="button" onClick={() => setOpenSheet('weight')}>
            <Plus aria-hidden="true" size={18} />
            添加体重
          </button>
          <button className="secondary-button" type="button" onClick={() => setOpenSheet('injection')}>
            <Syringe aria-hidden="true" size={18} />
            添加注射
          </button>
        </div>

        <section className="chart-panel" aria-labelledby="trend-heading">
          <div className="panel-heading">
            <p className="eyebrow">趋势</p>
            <h2 id="trend-heading">体重趋势</h2>
          </div>
          <TrendChart records={appData.weights} injections={appData.injections} />
        </section>

        <section className="info-panel" aria-label="注射概览">
          <div>
            <p className="eyebrow">最近注射日期</p>
            <p className="info-value">{latestInjection?.date ?? '--'}</p>
          </div>
          <div>
            <p className="eyebrow">距上次注射天数</p>
            <p className="info-value">{formatDays(daysSinceInjection)}</p>
          </div>
        </section>
      </section>

      <WeightEntrySheet
        open={openSheet === 'weight'}
        initialDate={today}
        onClose={() => setOpenSheet(null)}
        onSave={appData.actions.saveWeight}
      />
      <InjectionEntrySheet
        open={openSheet === 'injection'}
        initialDate={today}
        onClose={() => setOpenSheet(null)}
        onSave={appData.actions.saveInjection}
      />
    </>
  )
}
