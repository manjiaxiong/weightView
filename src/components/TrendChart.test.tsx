import { render, screen, within } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TrendChart } from './TrendChart'

vi.mock('recharts', () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: Array<{ date: string; weight: number }> }) => (
    <div data-testid="line-chart">
      {data.map((point) => (
        <span data-testid="chart-point" key={point.date}>
          {point.date}:{point.weight}
        </span>
      ))}
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />
}))

const baseRecord = {
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
}

describe('TrendChart', () => {
  it('renders an empty state without mounting a chart when there are no weights', () => {
    render(<TrendChart records={[]} />)

    expect(screen.getByText('No weight records yet.')).toBeVisible()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('sorts records chronologically for chart display', () => {
    render(
      <TrendChart
        records={[
          { ...baseRecord, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80.4 },
          { ...baseRecord, id: 'weight-2026-05-01', date: '2026-05-01', weight: 82.1 },
          { ...baseRecord, id: 'weight-2026-05-10', date: '2026-05-10', weight: 81 }
        ]}
      />
    )

    const chart = screen.getByTestId('line-chart')
    expect(within(chart).getAllByTestId('chart-point').map((point) => point.textContent)).toEqual([
      '05/01:82.1',
      '05/10:81',
      '05/12:80.4'
    ])
  })
})
