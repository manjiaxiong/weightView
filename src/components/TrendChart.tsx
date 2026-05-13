import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { compareIsoDateAsc, daysBetween } from '../domain/date'
import type { WeightRecord } from '../domain/types'

type ChartRange = '7' | '30' | 'all'

type TrendChartProps = {
  records: WeightRecord[]
}

const rangeOptions: Array<{ value: ChartRange; label: string }> = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: 'all', label: 'All' }
]

function formatChartDate(date: string): string {
  return date.slice(5).replace('-', '/')
}

export function TrendChart({ records }: TrendChartProps) {
  const [range, setRange] = useState<ChartRange>('30')

  const chartData = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => compareIsoDateAsc(a.date, b.date))

    if (range === 'all' || sortedRecords.length === 0) {
      return sortedRecords.map((record) => ({
        date: formatChartDate(record.date),
        fullDate: record.date,
        weight: record.weight
      }))
    }

    const latestDate = sortedRecords[sortedRecords.length - 1].date
    const rangeDays = Number(range)

    return sortedRecords
      .filter((record) => daysBetween(record.date, latestDate) < rangeDays)
      .map((record) => ({
        date: formatChartDate(record.date),
        fullDate: record.date,
        weight: record.weight
      }))
  }, [range, records])

  return (
    <div>
      <div className="segmented" aria-label="Trend range">
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
          <div className="empty-chart">No weight records yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: -18 }}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                dataKey="weight"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2f855a"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
