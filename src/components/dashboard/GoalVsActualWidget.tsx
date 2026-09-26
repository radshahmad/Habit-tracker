import { Card, CardTitle } from '@/components/common/Card'
import { SegmentedBar } from '@/components/common/SegmentedBar'
import { useActiveHabits, useRecordsForDate } from '@/hooks/useHabits'
import { remainingFor, isHabitActiveOn } from '@/utils/calculations'
import { todayKey } from '@/utils/dates'
import type { WidgetProps } from './widgetTypes'

export function GoalVsActualWidget({ size }: WidgetProps = {}) {
  const habits = useActiveHabits().filter((h) => h.trackingType !== 'simple' && isHabitActiveOn(h, todayKey()))
  const records = useRecordsForDate(todayKey())
  const byHabit = new Map(records.map((r) => [r.habitId, r]))

  return (
    <Card span={size ?? 'medium'}>
      <CardTitle>Goal vs Actual</CardTitle>
      {habits.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">No measurable habits scheduled today.</p>
      ) : (
        <div className="space-y-3">
          {habits.slice(0, 4).map((h) => {
            const actual = byHabit.get(h.id)?.actualValue ?? 0
            const target = h.target ?? 0
            const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
            return (
              <div key={h.id}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="font-medium text-ink dark:text-paper">{h.name}</span>
                  <span className="text-ink-soft/70 dark:text-paper/50">
                    {actual}/{target} {h.unit} · {remainingFor(target, actual)} left
                  </span>
                </div>
                <SegmentedBar pct={pct} segments={12} size="sm" showPct={false} color={pct >= 100 ? 'bg-growth-500' : 'bg-ember-500'} />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
