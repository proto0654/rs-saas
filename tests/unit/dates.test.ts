import { describe, expect, it } from 'vitest'
import { addDays, calendarWindow, calendarPeriod, shiftCalendarPeriod } from '../../shared/domain/dates'
import { search } from '../../shared/domain/booking'
import seed from '../../demo/seed.json'
import type { Database } from '../../shared/types/demo'

describe('demo date and search boundaries', () => {
  it('increments UTC days across month, year and DST boundaries', () => {
    expect(addDays('2027-12-31',1)).toBe('2028-01-01')
    expect(addDays('2028-02-28',1)).toBe('2028-02-29')
    expect(addDays('2027-03-28',1)).toBe('2027-03-29')
    expect(() => addDays('2027-02-30',1)).toThrow()
  })
  it('keeps the calendar usable when the date input is cleared', () => {
    const days = calendarWindow('', '2027-06-12')
    expect(days).toHaveLength(14)
    expect(days[0]).toBe('2027-06-12')
    expect(days.at(-1)).toBe('2027-06-25')
  })
  it('uses Monday-based weeks and calendar months across year and leap-day boundaries', () => {
    expect(calendarPeriod('2027-01-01','2027-06-12','week')).toEqual(['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03'])
    expect(calendarPeriod('2028-02-15','2027-06-12','month')).toHaveLength(29)
    expect(calendarPeriod('2027-02-15','2027-06-12','month').at(-1)).toBe('2027-02-28')
    expect(calendarPeriod('','2027-06-12','week')[0]).toBe('2027-06-07')
    expect(shiftCalendarPeriod('2027-12-31','2027-06-12','month',1)).toBe('2028-01-01')
    expect(shiftCalendarPeriod('2027-01-01','2027-06-12','week',-1)).toBe('2026-12-21')
  })
  it('preserves zero price and rejects invalid budgets', () => {
    expect(search(seed as Database,{...seed.defaultSearch,maxPrice:0})).toEqual([])
    for (const maxPrice of [-1,1.5,Infinity]) expect(() => search(seed as Database,{...seed.defaultSearch,maxPrice})).toThrow('Invalid price')
  })
})
