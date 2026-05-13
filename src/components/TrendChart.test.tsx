import { fireEvent, render, screen, within } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { InjectionRecord } from '../domain/types'
import { TrendChart } from './TrendChart'

vi.mock('recharts', () => ({
  LineChart: ({
    children,
    data,
    margin
  }: {
    children: React.ReactNode
    data: Array<{ date: string; weight: number }>
    margin?: { left?: number }
  }) => (
    <div data-testid="line-chart" data-margin-left={margin?.left}>
      {data.map((point) => (
        <span data-testid="chart-point" key={point.date}>
          {point.date}:{point.weight}
        </span>
      ))}
      {children}
    </div>
  ),
  Line: () => <div data-testid="line" />,
  ReferenceLine: ({ x }: { x: string }) => <div data-testid="ref-line" data-date={x} />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ width }: { width?: number }) => <div data-testid="y-axis" data-width={width} />
}))

const baseRecord = {
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
}

const baseInjection: InjectionRecord = {
  id: 'injection-2026-05-10',
  date: '2026-05-10',
  medicineName: 'Tirzepatide',
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-10T00:00:00.000Z'
}

describe('TrendChart', () => {
  it('renders an empty state without mounting a chart when there are no weights', () => {
    render(<TrendChart records={[]} injections={[]} />)

    expect(screen.getByText('暂无体重记录')).toBeVisible()
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
        injections={[]}
      />
    )

    const chart = screen.getByTestId('line-chart')
    expect(within(chart).getAllByTestId('chart-point').map((point) => point.textContent)).toEqual([
      '05/01:82.1',
      '05/10:81',
      '05/12:80.4'
    ])
  })

  it('renders reference lines for injection dates within the chart range', () => {
    render(
      <TrendChart
        records={[
          { ...baseRecord, id: 'weight-2026-05-01', date: '2026-05-01', weight: 82 },
          { ...baseRecord, id: 'weight-2026-05-10', date: '2026-05-10', weight: 81 },
          { ...baseRecord, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 }
        ]}
        injections={[baseInjection]}
      />
    )

    const refLines = screen.getAllByTestId('ref-line')
    expect(refLines).toHaveLength(1)
    expect(refLines[0].dataset.date).toBe('05/10')
  })

  it('supports switching to the 90 day range', () => {
    render(
      <TrendChart
        records={[
          { ...baseRecord, id: 'weight-2026-01-01', date: '2026-01-01', weight: 84 },
          { ...baseRecord, id: 'weight-2026-03-01', date: '2026-03-01', weight: 82 },
          { ...baseRecord, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 }
        ]}
        injections={[]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '90天' }))

    const chart = screen.getByTestId('line-chart')
    expect(within(chart).getAllByTestId('chart-point').map((point) => point.textContent)).toEqual([
      '03/01:82',
      '05/12:80'
    ])
  })

  it('keeps enough left chart space for y-axis labels', () => {
    render(
      <TrendChart
        records={[
          { ...baseRecord, id: 'weight-2026-05-01', date: '2026-05-01', weight: 112 },
          { ...baseRecord, id: 'weight-2026-05-12', date: '2026-05-12', weight: 106.8 }
        ]}
        injections={[]}
      />
    )

    expect(Number(screen.getByTestId('line-chart').dataset.marginLeft)).toBeGreaterThanOrEqual(0)
    expect(Number(screen.getByTestId('y-axis').dataset.width)).toBeGreaterThanOrEqual(56)
  })

  it('excludes injection markers outside the chart date range', () => {
    render(
      <TrendChart
        records={[
          { ...baseRecord, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 },
          { ...baseRecord, id: 'weight-2026-05-13', date: '2026-05-13', weight: 79 }
        ]}
        injections={[{ ...baseInjection, id: 'injection-old', date: '2026-04-01' }]}
      />
    )

    expect(screen.queryByTestId('ref-line')).not.toBeInTheDocument()
  })
})
