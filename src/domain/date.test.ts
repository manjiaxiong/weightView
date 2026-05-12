import { describe, expect, it } from 'vitest'
import {
  compareIsoDateDesc,
  daysBetween,
  getCalendarMonth,
  getTodayIsoDate,
  normalizeIsoDate
} from './date'

describe('date domain utilities', () => {
  it('normalizes Date values into local ISO date strings', () => {
    expect(normalizeIsoDate(new Date(2026, 4, 12))).toBe('2026-05-12')
  })

  it('returns input ISO dates unchanged after validation', () => {
    expect(normalizeIsoDate('2026-05-02')).toBe('2026-05-02')
  })

  it('rejects malformed date strings', () => {
    expect(() => normalizeIsoDate('2026-5-2')).toThrow('Expected date in YYYY-MM-DD format')
  })

  it('sorts ISO dates in descending order', () => {
    expect(['2026-05-10', '2026-05-12', '2026-05-01'].sort(compareIsoDateDesc)).toEqual([
      '2026-05-12',
      '2026-05-10',
      '2026-05-01'
    ])
  })

  it('calculates whole-day distance between two ISO dates', () => {
    expect(daysBetween('2026-05-05', '2026-05-12')).toBe(7)
  })

  it('builds a month grid with leading and trailing days', () => {
    const days = getCalendarMonth('2026-05-12')
    expect(days).toHaveLength(42)
    expect(days[0]).toMatchObject({ date: '2026-04-26', inCurrentMonth: false })
    expect(days[5]).toMatchObject({ date: '2026-05-01', inCurrentMonth: true })
  })

  it('returns a local today value in ISO format', () => {
    expect(getTodayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
