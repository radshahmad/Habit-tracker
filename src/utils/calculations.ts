import type { DailyRecord, Habit } from '@/types'
import { daysBetweenKeys, todayKey, calendarDayDiff, subDaysFromKey } from './dates'

/**
 * All calculation logic for the app lives here (and nowhere else) so that
 * completion %, streaks, and goal math are computed exactly the same way
 * on the Dashboard, Tracker, Statistics and Reports pages.
 *
 * A DailyRecord's `status` field is the single source of truth for whether
 * a day counts as completed — it is written by habitService at the moment
 * a habit is checked off or a measurable value is entered, using whichever
 * target/trackingType was in effect on that date (see habitService.getEffectiveConfig).
 * These functions never re-derive achievement from raw values; they just
 * aggregate `status`.
 */

export interface CompletionStats {
  total: number
  completed: number
  missed: number
  pending: number
  pct: number // 0-100, rounded
}

/** Is this habit scheduled/active on the given date (regardless of a record existing)? */
export function isHabitActiveOn(habit: Habit, dateKey: string): boolean {
  if (dateKey < habit.startDate) return false
  if (habit.endDate && dateKey > habit.endDate) return false
  return true
}

/**
 * Aggregate stats for one habit across a set of dates. Dates after today are
 * ignored (future days are never counted as missed). A past/today date with
 * no record and the habit active on it counts as missed/pending respectively.
 */
export function completionStatsForHabit(
  habit: Habit,
  records: DailyRecord[],
  dateKeys: string[],
): CompletionStats {
  const today = todayKey()
  const byDate = new Map(records.map((r) => [r.date, r]))
  let completed = 0
  let missed = 0
  let pending = 0
  let total = 0

  for (const date of dateKeys) {
    if (date > today) continue
    if (!isHabitActiveOn(habit, date)) continue
    total++
    const rec = byDate.get(date)
    const status = rec?.status ?? (date === today ? 'pending' : 'missed')
    if (status === 'completed') completed++
    else if (status === 'missed') missed++
    else pending++
  }

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, missed, pending, pct }
}

/** Aggregate stats across many habits for a single day (used by "Today's Progress"). */
export function completionStatsForDay(
  habits: Habit[],
  recordsForDay: DailyRecord[],
  date: string,
): CompletionStats {
  const byHabit = new Map(recordsForDay.map((r) => [r.habitId, r]))
  let completed = 0
  let missed = 0
  let pending = 0
  let total = 0

  for (const habit of habits) {
    if (habit.status !== 'active') continue
    if (!isHabitActiveOn(habit, date)) continue
    total++
    const rec = byHabit.get(habit.id)
    const status = rec?.status ?? 'pending'
    if (status === 'completed') completed++
    else if (status === 'missed') missed++
    else pending++
  }

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, missed, pending, pct }
}

/**
 * Current streak: consecutive completed days ending at today, walking
 * backwards. A pending (not-yet-acted-on) today does not break the streak —
 * we simply start counting from yesterday in that case.
 */
export function currentStreak(habit: Habit, records: DailyRecord[]): number {
  const byDate = new Map(records.map((r) => [r.date, r]))
  const today = todayKey()
  let cursor = today
  let streak = 0

  // If today is pending/未acted, skip it without breaking the streak.
  const todayRec = byDate.get(today)
  if (!todayRec || todayRec.status === 'pending') {
    cursor = shiftBack(cursor)
  }

  while (cursor >= habit.startDate) {
    if (!isHabitActiveOn(habit, cursor)) break
    const rec = byDate.get(cursor)
    if (rec?.status === 'completed') {
      streak++
      cursor = shiftBack(cursor)
    } else {
      break
    }
  }
  return streak
}

/** Longest streak across the habit's entire recorded history up to today. */
export function longestStreak(habit: Habit, records: DailyRecord[]): number {
  const byDate = new Map(records.map((r) => [r.date, r]))
  const today = todayKey()
  const start = habit.startDate > today ? today : habit.startDate
  if (start > today) return 0
  const allDates = daysBetweenKeys(start, today)

  let longest = 0
  let running = 0
  for (const date of allDates) {
    if (!isHabitActiveOn(habit, date)) {
      running = 0
      continue
    }
    const rec = byDate.get(date)
    const status = rec?.status ?? (date === today ? 'pending' : 'missed')
    if (status === 'completed') {
      running++
      longest = Math.max(longest, running)
    } else if (status === 'missed') {
      running = 0
    }
    // pending (only possible for "today") neither extends nor breaks
  }
  return longest
}

function shiftBack(dateKey: string): string {
  return subDaysFromKey(dateKey, 1)
}

export type ComparisonDirection = 'increased' | 'decreased' | 'unchanged'

export function compareValues(current: number, previous: number): {
  direction: ComparisonDirection
  deltaAbs: number
  deltaPct: number | null
} {
  const deltaAbs = current - previous
  const direction: ComparisonDirection = deltaAbs > 0 ? 'increased' : deltaAbs < 0 ? 'decreased' : 'unchanged'
  const deltaPct = previous === 0 ? null : Math.round((deltaAbs / previous) * 1000) / 10
  return { direction, deltaAbs, deltaPct }
}

/** Remaining amount to reach target for a measurable habit on a given day. */
export function remainingFor(target: number, actual: number): number {
  return Math.max(0, target - actual)
}

export function isGoalAchieved(trackingType: Habit['trackingType'], target: number | undefined, actual: number | undefined): boolean {
  if (trackingType === 'simple') return true // simple habits are achieved by being marked completed, not by value
  if (target == null) return false
  return (actual ?? 0) >= target
}

export function calendarDayDiffPublic(aKey: string, bKey: string): number {
  return calendarDayDiff(aKey, bKey)
}
