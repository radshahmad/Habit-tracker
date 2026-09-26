import { describe, it, expect } from 'vitest'
import {
  completionStatsForHabit,
  currentStreak,
  longestStreak,
  isGoalAchieved,
  compareValues,
  remainingFor,
} from '../calculations'
import { todayKey, subDaysFromKey } from '../dates'
import type { DailyRecord, Habit } from '@/types'

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  const today = todayKey()
  return {
    id: 'h1',
    name: 'Test habit',
    icon: '✅',
    color: '#000000',
    categoryId: 'cat-other',
    trackingType: 'simple',
    startDate: subDaysFromKey(today, 30),
    sortOrder: 0,
    status: 'active',
    createdAt: today,
    updatedAt: today,
    ...overrides,
  }
}

function record(habitId: string, date: string, status: DailyRecord['status'], actualValue?: number): DailyRecord {
  return { id: `${habitId}-${date}`, habitId, date, status, actualValue, createdAt: date, updatedAt: date }
}

describe('isGoalAchieved', () => {
  it('simple habits are always "achieved" (achievement is the completed status itself)', () => {
    expect(isGoalAchieved('simple', undefined, undefined)).toBe(true)
  })
  it('measurable habit achieved only when actual >= target', () => {
    expect(isGoalAchieved('count', 10, 10)).toBe(true)
    expect(isGoalAchieved('count', 10, 9)).toBe(false)
    expect(isGoalAchieved('count', 10, 11)).toBe(true)
  })
})

describe('completionStatsForHabit', () => {
  it('counts completed/missed/pending correctly and ignores future dates', () => {
    const today = todayKey()
    const habit = makeHabit()
    const y1 = subDaysFromKey(today, 1)
    const y2 = subDaysFromKey(today, 2)
    const tomorrow = subDaysFromKey(today, -1)
    const records = [record(habit.id, y1, 'completed'), record(habit.id, y2, 'missed')]
    const stats = completionStatsForHabit(habit, records, [y2, y1, today, tomorrow])
    // tomorrow must be excluded from totals entirely
    expect(stats.total).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.missed).toBe(1)
    expect(stats.pending).toBe(1) // today, no record yet
  })

  it('excludes dates before the habit existed', () => {
    const today = todayKey()
    const habit = makeHabit({ startDate: today })
    const before = subDaysFromKey(today, 5)
    const stats = completionStatsForHabit(habit, [], [before, today])
    expect(stats.total).toBe(1) // only today counts
  })
})

describe('currentStreak', () => {
  it('counts consecutive completed days ending today', () => {
    const today = todayKey()
    const habit = makeHabit()
    const records = [
      record(habit.id, today, 'completed'),
      record(habit.id, subDaysFromKey(today, 1), 'completed'),
      record(habit.id, subDaysFromKey(today, 2), 'completed'),
      record(habit.id, subDaysFromKey(today, 3), 'missed'),
    ]
    expect(currentStreak(habit, records)).toBe(3)
  })

  it('does not break the streak when today is still pending', () => {
    const today = todayKey()
    const habit = makeHabit()
    const records = [
      record(habit.id, subDaysFromKey(today, 1), 'completed'),
      record(habit.id, subDaysFromKey(today, 2), 'completed'),
    ]
    // no record for today at all -> pending, should not break the streak
    expect(currentStreak(habit, records)).toBe(2)
  })

  it('is broken by an explicit miss', () => {
    const today = todayKey()
    const habit = makeHabit()
    const records = [record(habit.id, today, 'missed')]
    expect(currentStreak(habit, records)).toBe(0)
  })
})

describe('longestStreak', () => {
  it('finds the longest run across history, even if not the most recent', () => {
    const today = todayKey()
    const habit = makeHabit()
    const records = [
      record(habit.id, subDaysFromKey(today, 10), 'completed'),
      record(habit.id, subDaysFromKey(today, 9), 'completed'),
      record(habit.id, subDaysFromKey(today, 8), 'completed'),
      record(habit.id, subDaysFromKey(today, 7), 'completed'),
      record(habit.id, subDaysFromKey(today, 6), 'missed'),
      record(habit.id, subDaysFromKey(today, 1), 'completed'),
    ]
    expect(longestStreak(habit, records)).toBe(4)
  })
})

describe('compareValues', () => {
  it('reports increased/decreased/unchanged correctly', () => {
    expect(compareValues(80, 60).direction).toBe('increased')
    expect(compareValues(40, 60).direction).toBe('decreased')
    expect(compareValues(60, 60).direction).toBe('unchanged')
  })
})

describe('remainingFor', () => {
  it('never goes negative', () => {
    expect(remainingFor(10, 12)).toBe(0)
    expect(remainingFor(10, 4)).toBe(6)
  })
})
