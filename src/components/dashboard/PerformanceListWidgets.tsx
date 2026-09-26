import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardTitle } from '@/components/common/Card'
import { statisticsService, type HabitPerformance } from '@/services/statisticsService'
import type { WidgetProps } from './widgetTypes'

function useMonthlyPerformances() {
  const [performances, setPerformances] = useState<HabitPerformance[]>([])
  useEffect(() => {
    let cancelled = false
    statisticsService.monthlyPerformance().then((p) => {
      if (!cancelled) setPerformances(p.filter((x) => x.stats.total > 0))
    })
    return () => {
      cancelled = true
    }
  }, [])
  return performances
}

export function BestHabitsWidget({ size }: WidgetProps = {}) {
  const performances = useMonthlyPerformances()
  const top = [...performances].sort((a, b) => b.stats.pct - a.stats.pct).slice(0, 3)
  return (
    <Card span={size ?? 'small'}>
      <CardTitle action={<TrendingUp className="h-4 w-4 text-growth-500" />}>Best-performing</CardTitle>
      {top.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">Not enough data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {top.map((p) => (
            <li key={p.habit.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{p.habit.icon} {p.habit.name}</span>
              <span className="font-semibold text-growth-600 dark:text-growth-300">{p.stats.pct}%</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function LeastHabitsWidget({ size }: WidgetProps = {}) {
  const performances = useMonthlyPerformances()
  const bottom = [...performances].sort((a, b) => a.stats.pct - b.stats.pct).slice(0, 3)
  return (
    <Card span={size ?? 'small'}>
      <CardTitle action={<TrendingDown className="h-4 w-4 text-brick-500" />}>Least-completed</CardTitle>
      {bottom.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">Not enough data yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {bottom.map((p) => (
            <li key={p.habit.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{p.habit.icon} {p.habit.name}</span>
              <span className="font-semibold text-brick-500">{p.stats.pct}%</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
