import { useMemo, useState } from 'react'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { compareIsoDateAsc, daysBetween } from '../domain/date'
import type { InjectionRecord, WeightRecord } from '../domain/types'

type ChartRange = '7' | '30' | '90' | 'all'

type TrendChartProps = {
  records: WeightRecord[]
  injections: InjectionRecord[]
}

const rangeOptions: Array<{ value: ChartRange; label: string }> = [
  { value: '7', label: '7天' },
  { value: '30', label: '30天' },
  { value: '90', label: '90天' },
  { value: 'all', label: '全部' }
]

function formatChartDate(date: string): string {
  return date.slice(5).replace('-', '/')
}

export function TrendChart({ records, injections }: TrendChartProps) {
  const [range, setRange] = useState<ChartRange>('30')

  const { chartData, injectionDates } = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => compareIsoDateAsc(a.date, b.date))

    let filteredRecords: WeightRecord[]
    if (range === 'all' || sortedRecords.length === 0) {
      filteredRecords = sortedRecords
    } else {
      const latestDate = sortedRecords[sortedRecords.length - 1].date
      const rangeDays = Number(range)
      filteredRecords = sortedRecords.filter((record) => daysBetween(record.date, latestDate) < rangeDays)
    }

    const earliestDate = filteredRecords.length > 0 ? filteredRecords[0].date : null
    const latestDate = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].date : null

    const injectionDatesInRange = injections
      .filter((inj) => {
        if (!earliestDate || !latestDate) return false
        return inj.date >= earliestDate && inj.date <= latestDate
      })
      .map((inj) => inj.date)

    const mapped = filteredRecords.map((record) => ({
      date: formatChartDate(record.date),
      fullDate: record.date,
      weight: record.weight
    }))

    return { chartData: mapped, injectionDates: injectionDatesInRange }
  }, [range, records, injections])

  return (
    <div>
      <div className="segmented" aria-label="趋势范围">
        {rangeOptions.map((option) => (
          <button
            aria-pressed={range === option.value}
            className={range === option.value ? 'active' : undefined}
            key={option.value}
            type="button"
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="chart-box">
        {chartData.length === 0 ? (
          <div className="empty-chart">暂无体重记录</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#d9e2dc' }}
                tickMargin={10}
                tick={{ fontSize: 12, fill: '#627d98' }}
              />
              <YAxis
                dataKey="weight"
                tickLine={false}
                axisLine={ false }
                tickMargin={8}
                width={56}
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 12, fill: '#627d98' }}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} kg`, '体重']}
                labelFormatter={(_, payload) => {
                  const fullDate = payload?.[0]?.payload?.fullDate ?? ''
                  const hasInjection = injectionDates.includes(fullDate)
                  return hasInjection ? `${fullDate} (注射日)` : fullDate
                }}
                contentStyle={{
                  border: '1px solid #d9e2dc',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
              {injectionDates.map((date) => (
                <ReferenceLine
                  key={date}
                  x={formatChartDate(date)}
                  stroke="#d97706"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              ))}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2f855a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2f855a', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#2f855a', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
