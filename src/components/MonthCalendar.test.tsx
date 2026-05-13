import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MonthCalendar } from './MonthCalendar'

const baseWeight = {
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z'
}

const baseInjection = {
  medicineName: 'Tirzepatide',
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z'
}

describe('MonthCalendar', () => {
  it('renders weight and injection markers as separate readable rows in a day cell', () => {
    render(
      <MonthCalendar
        anchorDate="2026-05-01"
        weights={[{ ...baseWeight, id: 'weight-2026-05-06', date: '2026-05-06', weight: 112 }]}
        injections={[{ ...baseInjection, id: 'injection-2026-05-06', date: '2026-05-06' }]}
        onSelectDate={vi.fn()}
      />
    )

    const day = screen.getByText('112.0').closest('button')
    if (!day) {
      throw new Error('Expected the weight marker to be inside a calendar day button')
    }
    const markers = day.querySelector('.calendar-day-markers')

    expect(markers).toBeInTheDocument()
    expect(markers?.children).toHaveLength(2)
    expect(within(day).getByText('112.0')).toHaveClass('calendar-marker', 'weight-marker')
    expect(within(day).getByText('已注射')).toHaveClass('calendar-marker', 'injection-marker')
  })
})
