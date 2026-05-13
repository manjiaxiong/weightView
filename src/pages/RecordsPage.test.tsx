import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { useAppData } from '../app/useAppData'
import { RecordsPage } from './RecordsPage'

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
      saveSettings: vi.fn(async () => undefined),
      replaceData: vi.fn(async () => undefined)
    },
    ...overrides
  }
}

describe('RecordsPage', () => {
  it('opens the weight edit sheet from a record row', () => {
    render(
      <RecordsPage
        appData={createAppData({
          weights: [{ ...baseWeight, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 }]
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '编辑' }))

    expect(screen.getByRole('dialog', { name: '编辑体重' })).toBeVisible()
    expect(screen.getByLabelText('体重 (kg)')).toHaveValue(80)
  })

  it('opens the injection edit sheet from a record row', () => {
    render(
      <RecordsPage
        appData={createAppData({
          injections: [{ ...baseInjection, id: 'injection-2026-05-12', date: '2026-05-12', dose: '2.5 mg' }]
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '编辑' }))

    expect(screen.getByRole('dialog', { name: '编辑注射' })).toBeVisible()
    expect(screen.getByLabelText('剂量')).toHaveValue('2.5 mg')
  })

  it('does not delete a record when confirmation is cancelled', () => {
    const removeWeight = vi.fn(async () => undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <RecordsPage
        appData={createAppData({
          weights: [{ ...baseWeight, id: 'weight-2026-05-12', date: '2026-05-12', weight: 80 }],
          actions: {
            ...createAppData().actions,
            removeWeight
          }
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '删除' }))

    expect(removeWeight).not.toHaveBeenCalled()
  })

  it('deletes a record after confirmation', async () => {
    const removeInjection = vi.fn(async () => undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <RecordsPage
        appData={createAppData({
          injections: [{ ...baseInjection, id: 'injection-2026-05-12', date: '2026-05-12' }],
          actions: {
            ...createAppData().actions,
            removeInjection
          }
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '删除' }))

    await waitFor(() => expect(removeInjection).toHaveBeenCalledWith('injection-2026-05-12'))
  })
})
