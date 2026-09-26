import { Card, CardTitle } from '@/components/common/Card'
import { SegmentedBar } from '@/components/common/SegmentedBar'
import { useActiveHabits, useRecordsForDate } from '@/hooks/useHabits'
import { completionStatsForDay, isHabitActiveOn } from '@/utils/calculations'
import { todayKey } from '@/utils/dates'
import { Check, X, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { WidgetProps } from './widgetTypes'

export function TodaysProgressWidget({ size }: WidgetProps = {}) {
  const habits = useActiveHabits()
  const today = todayKey()
  const records = useRecordsForDate(today)
  const scheduled = habits.filter((h) => isHabitActiveOn(h, today))
  const stats = completionStatsForDay(scheduled, records, today)

  return (
    <Card span={size ?? 'large'}>
      <CardTitle>Today's Progress</CardTitle>
      {stats.total === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">Nothing scheduled for today yet.</p>
      ) : (
        <>
          <SegmentedBar pct={stats.pct} size="lg" showPct={false} />
          <div className="mt-3 grid grid-cols-4 gap-3 text-center">
            <Stat label="Total" value={stats.total} />
            <Stat label="Completed" value={stats.completed} tone="text-growth-600 dark:text-growth-300" />
            <Stat label="Missed" value={stats.missed} tone="text-brick-500" />
            <Stat label="Remaining" value={stats.pending} tone="text-ember-500" />
          </div>
          <p className="mt-3 text-center font-display text-2xl font-extrabold text-ink dark:text-paper">{stats.pct}%</p>
        </>
      )}
    </Card>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <p className={`font-display text-lg font-bold tabular-nums ${tone ?? 'text-ink dark:text-paper'}`}>{value}</p>
      <p className="text-[11px] text-ink-soft/60 dark:text-paper/40">{label}</p>
    </div>
  )
}

export function HabitCompletionWidget({ size }: WidgetProps = {}) {
  const habits = useActiveHabits()
  const today = todayKey()
  const records = useRecordsForDate(today)
  const byHabit = new Map(records.map((r) => [r.habitId, r]))
  const scheduled = habits.filter((h) => isHabitActiveOn(h, today))

  return (
    <Card span={size ?? 'medium'}>
      <CardTitle action={<Link to="/today" className="text-xs font-medium text-growth-600 hover:underline dark:text-growth-300">Open Today</Link>}>
        Habit Completion
      </CardTitle>
      {scheduled.length === 0 ? (
        <p className="text-sm text-ink-soft dark:text-paper/60">No habits scheduled today.</p>
      ) : (
        <ul className="space-y-1.5">
          {scheduled.slice(0, 6).map((h) => {
            const status = byHabit.get(h.id)?.status ?? 'pending'
            const Icon = status === 'completed' ? Check : status === 'missed' ? X : Minus
            const tone =
              status === 'completed'
                ? 'text-growth-600 dark:text-growth-300'
                : status === 'missed'
                  ? 'text-brick-500'
                  : 'text-ink-soft/40 dark:text-paper/30'
            return (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
                <span className="truncate">{h.name}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
