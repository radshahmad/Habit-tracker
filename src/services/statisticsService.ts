import type { Habit } from '@/types'
import { habitService } from './habitService'
import {
  completionStatsForHabit,
  currentStreak,
  longestStreak,
  type CompletionStats,
} from '@/utils/calculations'
import { daysBetweenKeys, monthRangeForKey, weekRangeForKey, todayKey } from '@/utils/dates'

export interface HabitPerformance {
  habit: Habit
  stats: CompletionStats
  currentStreak: number
  longestStreak: number
}

export const statisticsService = {
  /** Full performance snapshot for every active habit over a date range. */
  async performanceForRange(dateKeys: string[]): Promise<HabitPerformance[]> {
    const habits = await habitService.listActive()
    const records = await habitService.getRecordsForHabits(habits.map((h) => h.id))
    const byHabit = new Map<string, typeof records>()
    for (const r of records) {
      const list = byHabit.get(r.habitId) ?? []
      list.push(r)
      byHabit.set(r.habitId, list)
    }

    return habits.map((habit) => {
      const habitRecords = byHabit.get(habit.id) ?? []
      return {
        habit,
        stats: completionStatsForHabit(habit, habitRecords, dateKeys),
        currentStreak: currentStreak(habit, habitRecords),
        longestStreak: longestStreak(habit, habitRecords),
      }
    })
  },

  async weeklyPerformance(anchorDate = todayKey()): Promise<HabitPerformance[]> {
    const { start, end } = weekRangeForKey(anchorDate)
    return this.performanceForRange(daysBetweenKeys(start, end))
  },

  async monthlyPerformance(anchorDate = todayKey()): Promise<HabitPerformance[]> {
    const { start, end } = monthRangeForKey(anchorDate)
    return this.performanceForRange(daysBetweenKeys(start, end))
  },

  bestAndLeast(performances: HabitPerformance[]): { best?: HabitPerformance; least?: HabitPerformance } {
    const withData = performances.filter((p) => p.stats.total > 0)
    if (withData.length === 0) return {}
    const sorted = [...withData].sort((a, b) => b.stats.pct - a.stats.pct)
    return { best: sorted[0], least: sorted[sorted.length - 1] }
  },

  overallPct(performances: HabitPerformance[]): number {
    if (performances.length === 0) return 0
    const totalDays = performances.reduce((sum, p) => sum + p.stats.total, 0)
    const totalCompleted = performances.reduce((sum, p) => sum + p.stats.completed, 0)
    if (totalDays === 0) return 0
    return Math.round((totalCompleted / totalDays) * 100)
  },

  /** Daily completion % series for a date range, for line/bar charts. */
  async dailyTrend(dateKeys: string[]): Promise<{ date: string; pct: number }[]> {
    const habits = await habitService.listActive()
    const records = await habitService.getRecordsForHabits(habits.map((h) => h.id))
    return dateKeys.map((date) => {
      const activeHabits = habits.filter((h) => date >= h.startDate && (!h.endDate || date <= h.endDate))
      if (activeHabits.length === 0 || date > todayKey()) return { date, pct: 0 }
      const dayRecords = records.filter((r) => r.date === date)
      const byHabit = new Map(dayRecords.map((r) => [r.habitId, r]))
      const completed = activeHabits.filter((h) => byHabit.get(h.id)?.status === 'completed').length
      return { date, pct: Math.round((completed / activeHabits.length) * 100) }
    })
  },
}
