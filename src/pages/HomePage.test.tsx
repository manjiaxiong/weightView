import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { useAppData } from '../app/useAppData'
import { HomePage } from './HomePage'

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />
}))

const baseWeight = {
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
}

const baseInjection = {
  medicineName: 'Tirzepatide',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
}

function createAppData(
  overrides: Partial<ReturnType<typeof useAppData>> = {}
): ReturnType<typeof useAppData> {
  return {
    data: null,
    loadState: 'ready',
    error: null,
    saveError: null,
    weights: [],
    injections: [],
    actions: {
      saveWeight: vi.fn(async () => undefined),
      removeWeight: vi.fn(async () => undefined),
      saveInjection: vi.fn(async () => undefined),
      removeInjection: vi.fn(async () => undefined),
      replaceData: vi.fn(async () => undefined)
    },
    ...overrides
  }
}

describe('HomePage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders dashboard values and a clean empty state when no records exist', () => {
    render(<HomePage appData={createAppData()} />)

    expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible()
    expect(screen.getByText('Latest weight')).toBeVisible()
    expect(screen.getAllByText('--')).toHaveLength(4)
    expect(screen.getByText('No weight records yet.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add weight' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add injection' })).toBeVisible()
  })

  it('renders latest metrics from unsorted records', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-13T12:00:00.000Z'))

    render(
      <HomePage
        appData={createAppData({
          weights: [
            { ...baseWeight, id: 'weight-2026-05-01', date: '2026-05-01', weight: 82 },
            { ...baseWeight, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 },
            { ...baseWeight, id: 'weight-2026-05-10', date: '2026-05-10', weight: 81 }
          ],
          injections: [{ ...baseInjection, id: 'injection-2026-05-10', date: '2026-05-10' }]
        })}
      />
    )

    expect(screen.getByText('80.0 kg')).toBeVisible()
    expect(screen.getByText('-1.0 kg')).toBeVisible()
    expect(screen.getByText('2026-05-10')).toBeVisible()
    expect(screen.getByText('3 days')).toBeVisible()
  })

  it('opens entry sheets and saves through app data actions', async () => {
    const saveWeight = vi.fn(async () => undefined)
    const saveInjection = vi.fn(async () => undefined)

    render(
      <HomePage
        appData={createAppData({
          actions: {
            ...createAppData().actions,
            saveWeight,
            saveInjection
          }
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add weight' }))
    expect(screen.getByRole('dialog', { name: 'Add weight' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '79.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save weight' }))

    await waitFor(() =>
      expect(saveWeight).toHaveBeenCalledWith({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), weight: 79.5 })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add injection' }))
    expect(screen.getByRole('dialog', { name: 'Add injection' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Dose'), { target: { value: '2.5 mg' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save injection' }))

    await waitFor(() =>
      expect(saveInjection).toHaveBeenCalledWith({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        medicineName: 'Tirzepatide',
        dose: '2.5 mg'
      })
    )
  })
})
