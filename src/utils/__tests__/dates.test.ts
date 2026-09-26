import { describe, it, expect } from 'vitest'
import { addDaysToKey, subDaysFromKey, isFutureKey, isPastKey, isTodayKey, todayKey, daysBetweenKeys } from '../dates'

describe('date key helpers (local-calendar-day safe)', () => {
  it('today is neither future nor past', () => {
    const today = todayKey()
    expect(isTodayKey(today)).toBe(true)
    expect(isFutureKey(today)).toBe(false)
    expect(isPastKey(today)).toBe(false)
  })

  it('tomorrow is future, yesterday is past', () => {
    const today = todayKey()
    expect(isFutureKey(addDaysToKey(today, 1))).toBe(true)
    expect(isPastKey(subDaysFromKey(today, 1))).toBe(true)
  })

  it('daysBetweenKeys is inclusive on both ends', () => {
    const start = '2026-01-01'
    const end = '2026-01-05'
    expect(daysBetweenKeys(start, end)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'])
  })

  it('addDaysToKey/subDaysFromKey round-trip correctly across a month boundary', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01')
    expect(subDaysFromKey('2026-03-01', 1)).toBe('2026-02-28')
  })
})
