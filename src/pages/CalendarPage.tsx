import { addMonths, format, parseISO } from 'date-fns'
import { useState } from 'react'

import type { useAppData } from '../app/useAppData'
import { InjectionEntrySheet } from '../components/InjectionEntrySheet'
import { MonthCalendar } from '../components/MonthCalendar'
import { WeightEntrySheet } from '../components/WeightEntrySheet'
import { getTodayIsoDate, normalizeIsoDate } from '../domain/date'

type PageProps = {
  appData: ReturnType<typeof useAppData>
}

export function CalendarPage({ appData }: PageProps) {
  const [anchorDate, setAnchorDate] = useState(getTodayIsoDate())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [mode, setMode] = useState<'weight' | 'injection' | null>(null)

  const selectedWeight = selectedDate ? appData.weights.find((record) => record.date === selectedDate) : undefined
  const selectedInjection = selectedDate ? appData.injections.find((record) => record.date === selectedDate) : undefined

  function shiftMonth(amount: number) {
    setAnchorDate(normalizeIsoDate(addMonths(parseISO(anchorDate), amount)))
  }

  return (
    <section className="page">
      <header className="page-header">
        <button className="secondary-button compact" type="button" onClick={() => shiftMonth(-1)}>上月</button>
        <h1>{format(parseISO(anchorDate), 'yyyy-MM')}</h1>
        <button className="secondary-button compact" type="button" onClick={() => shiftMonth(1)}>下月</button>
      </header>

      <MonthCalendar
        anchorDate={anchorDate}
        weights={appData.weights}
        injections={appData.injections}
        onSelectDate={setSelectedDate}
      />

      {selectedDate && (
        <section className="date-actions">
          <h2>{selectedDate}</h2>
          <div className="quick-grid">
            <button className="primary-button" type="button" onClick={() => setMode('weight')}>
              {selectedWeight ? '编辑体重' : '添加体重'}
            </button>
            <button className="secondary-button" type="button" onClick={() => setMode('injection')}>
              {selectedInjection ? '编辑注射' : '添加注射'}
            </button>
          </div>
        </section>
      )}

      <WeightEntrySheet
        open={mode === 'weight'}
        record={selectedWeight}
        initialDate={selectedDate || undefined}
        onClose={() => setMode(null)}
        onSave={appData.actions.saveWeight}
      />
      <InjectionEntrySheet
        open={mode === 'injection'}
        record={selectedInjection}
        initialDate={selectedDate || undefined}
        onClose={() => setMode(null)}
        onSave={appData.actions.saveInjection}
      />
    </section>
  )
}
