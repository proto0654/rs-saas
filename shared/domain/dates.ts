import { day } from './booking'

export function addDays(value: string, count: number): string {
  const timestamp = (day(value) + count) * 86400000
  if (!Number.isSafeInteger(count)) throw new Error('Invalid day offset')
  return new Date(timestamp).toISOString().slice(0, 10)
}
export function calendarWindow(start: string, fallback: string, count = 14): string[] {
  let validStart = start
  try { day(start) } catch { validStart = fallback }
  return Array.from({ length: count }, (_, index) => addDays(validStart, index))
}

export type CalendarPeriodMode = 'week' | 'month'

export function calendarPeriod(value: string, fallback: string, mode: CalendarPeriodMode): string[] {
  let anchor = value
  try { day(anchor) } catch { anchor = fallback }
  const date = new Date(day(anchor) * 86400000)
  if (mode === 'week') {
    const mondayOffset = (date.getUTCDay() + 6) % 7
    return calendarWindow(addDays(anchor, -mondayOffset), fallback, 7)
  }
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const count = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  return calendarWindow(first.toISOString().slice(0, 10), fallback, count)
}

export function shiftCalendarPeriod(value: string, fallback: string, mode: CalendarPeriodMode, direction: -1 | 1): string {
  const start = calendarPeriod(value, fallback, mode)[0]!
  if (mode === 'week') return addDays(start, direction * 7)
  const date = new Date(day(start) * 86400000)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, 1)).toISOString().slice(0, 10)
}
