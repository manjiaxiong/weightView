import { addDays, differenceInCalendarDays, endOfMonth, format, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import type { CalendarDay, IsoDate } from './types'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const INVALID_ISO_DATE_ERROR = 'Expected a valid date in YYYY-MM-DD format'

export function normalizeIsoDate(value: Date | string): IsoDate {
  if (value instanceof Date) {
    return format(value, 'yyyy-MM-dd')
  }

  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error(INVALID_ISO_DATE_ERROR)
  }

  const parsed = parseISO(value)
  if (!isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== value) {
    throw new Error(INVALID_ISO_DATE_ERROR)
  }

  return value
}

export function getTodayIsoDate(): IsoDate {
  return normalizeIsoDate(new Date())
}

export function compareIsoDateDesc(a: IsoDate, b: IsoDate): number {
  return b.localeCompare(a)
}

export function compareIsoDateAsc(a: IsoDate, b: IsoDate): number {
  return a.localeCompare(b)
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from))
}

export function getCalendarMonth(anchorDate: IsoDate): CalendarDay[] {
  const anchor = parseISO(anchorDate)
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  const days: CalendarDay[] = []

  for (let index = 0; index < 42; index += 1) {
    const day = addDays(gridStart, index)
    days.push({
      date: normalizeIsoDate(day),
      inCurrentMonth: day >= monthStart && day <= monthEnd
    })
  }

  return days
}
