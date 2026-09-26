import { useEffect, useState } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { Card, CardTitle } from '@/components/common/Card'
import { useActiveHabits } from '@/hooks/useHabits'
import { habitService } from '@/services/habitService'
import { currentStreak, longestStreak } from '@/utils/calculations'
import type { Habit } from '@/types'
import type { WidgetProps } from './widgetTypes'

function useBestStreaks() {
  const habits = useActiveHabits()
  const [best, setBest] = useState<{ habit: Habit; value: number } | null>(null)
  const [bestLongest, setBestLongest] = useState<{ habit: Habit; value: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      let topCurrent: { habit: Habit; value: number } | null = null
      let topLongest: { habit: Habit; value: number } | null = null
      for (const habit of habits) {
        const records = await habitService.getRecordsForHabit(habit.id)
        const cur = currentStreak(habit, records)
        const lon = longestStreak(habit, records)
        if (!topCurrent || cur > topCurrent.value) topCurrent = { habit, value: cur }
        if (!topLongest || lon > topLongest.value) topLongest = { habit, value: lon }
      }
      if (!cancelled) {
        setBest(topCurrent)
        setBestLongest(topLongest)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [habits])

  return { best, bestLongest }
}

export function CurrentStreakWidget({ size }: WidgetProps = {}) {
  const { best } = useBestStreaks()
  return (
    <Card span={size ?? 'small'}>
      <CardTitle>Current Streak</CardTitle>
      <div className="flex items-center gap-3">
        <Flame className="h-8 w-8 text-ember-500" />
        <div>
          <p className="font-display text-2xl font-extrabold tabular-nums text-ink dark:text-paper">{best?.value ?? 0}</p>
          <p className="truncate text-xs text-ink-soft/70 dark:text-paper/40">{best ? best.habit.name : 'No streaks yet'}</p>
        </div>
      </div>
    </Card>
  )
}

export function LongestStreakWidget({ size }: WidgetProps = {}) {
  const { bestLongest } = useBestStreaks()
  return (
    <Card span={size ?? 'small'}>
      <CardTitle>Longest Streak</CardTitle>
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-growth-500" />
        <div>
          <p className="font-display text-2xl font-extrabold tabular-nums text-ink dark:text-paper">{bestLongest?.value ?? 0}</p>
          <p className="truncate text-xs text-ink-soft/70 dark:text-paper/40">{bestLongest ? bestLongest.habit.name : 'No streaks yet'}</p>
        </div>
      </div>
    </Card>
  )
}
