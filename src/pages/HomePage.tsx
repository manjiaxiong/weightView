import { Plus, Syringe } from 'lucide-react'
import { useState } from 'react'

import type { useAppData } from '../app/useAppData'
import { InjectionEntrySheet } from '../components/InjectionEntrySheet'
import { TrendChart } from '../components/TrendChart'
import { WeightEntrySheet } from '../components/WeightEntrySheet'
import { daysBetween, getTodayIsoDate } from '../domain/date'
import { getLatestInjection } from '../domain/injection'
import { getLatestWeight, getWeightDelta } from '../domain/weight'

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

function formatDays(value: number | undefined): string {
  if (value === undefined) {
    return '--'
  }

  return value === 1 ? '1 day' : `${value} days`
}

export function HomePage({ appData }: HomePageProps) {
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null)
  const today = getTodayIsoDate()
  const latestWeight = getLatestWeight(appData.weights)
  const weightDelta = getWeightDelta(appData.weights)
  const latestInjection = getLatestInjection(appData.injections)
  const daysSinceInjection = latestInjection ? daysBetween(latestInjection.date, today) : undefined

  return (
    <>
      <section className="page home-page">
        <header className="page-header">
          <p className="eyebrow">Weight View</p>
          <h1>Home</h1>
        </header>

        <section className="hero-panel" aria-label="Weight summary">
          <div>
            <p className="eyebrow">Latest weight</p>
            <p className="metric-value">{formatWeight(latestWeight?.weight)}</p>
          </div>
          <div>
            <p className="eyebrow">Change from previous</p>
            <p className="metric-value secondary">{formatDelta(weightDelta)}</p>
          </div>
        </section>

        <div className="quick-grid" aria-label="Quick entry">
          <button className="primary-button" type="button" onClick={() => setOpenSheet('weight')}>
            <Plus aria-hidden="true" size={18} />
            Add weight
          </button>
          <button className="secondary-button" type="button" onClick={() => setOpenSheet('injection')}>
            <Syringe aria-hidden="true" size={18} />
            Add injection
          </button>
        </div>

        <section className="chart-panel" aria-labelledby="trend-heading">
          <div className="panel-heading">
            <p className="eyebrow">Trend</p>
            <h2 id="trend-heading">Weight trend</h2>
          </div>
          <TrendChart records={appData.weights} />
        </section>

        <section className="info-panel" aria-label="Injection summary">
          <div>
            <p className="eyebrow">Latest injection date</p>
            <p className="info-value">{latestInjection?.date ?? '--'}</p>
          </div>
          <div>
            <p className="eyebrow">Days since latest injection</p>
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
