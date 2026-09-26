import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { Card, CardTitle } from '@/components/common/Card'
import { useActiveHabits, useRecordsForHabits } from '@/hooks/useHabits'
import { formatFriendly } from '@/utils/dates'
import type { WidgetProps } from './widgetTypes'

export function RecentActivityWidget({ size }: WidgetProps = {}) {
  const habits = useActiveHabits()
  const records = useRecordsForHabits(habits.map((h) => h.id))
  const habitById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits])

  const recent = [...records]
    .filter((r) => r.status !== 'pending')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 6)

  return (
    <Card span={size ?? 'medium'}>
      <CardTitle>Recent Activity</CardTitle>
      {recent.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">Nothing tracked yet.</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((r) => {
            const habit = habitById.get(r.habitId)
            if (!habit) return null
            return (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                {r.status === 'completed' ? (
                  <Check className="h-4 w-4 shrink-0 text-growth-600 dark:text-growth-300" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-brick-500" />
                )}
                <span className="min-w-0 flex-1 truncate">{habit.name}</span>
                <span className="shrink-0 text-xs text-ink-soft/50 dark:text-paper/30">{formatFriendly(r.date)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
