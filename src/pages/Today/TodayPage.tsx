import { useMemo, useState } from 'react'
import { AlertTriangle, Lock, Unlock, Sparkles, ListChecks } from 'lucide-react'
import { DateNav } from '@/components/tracker/DateNav'
import { HabitCompletionControl } from '@/components/tracker/HabitCompletionControl'
import { DailyNoteEditor } from '@/components/common/DailyNoteEditor'
import { SegmentedBar } from '@/components/common/SegmentedBar'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/common/Card'
import { useActiveHabits, useCategories, useRecordsForDate } from '@/hooks/useHabits'
import { habitService, LockedDayError } from '@/services/habitService'
import { useToast } from '@/components/common/Toast'
import { completionStatsForDay, isHabitActiveOn } from '@/utils/calculations'
import { greetingForNow, isFutureKey, isPastKey, todayKey } from '@/utils/dates'

export default function TodayPage() {
  const [date, setDate] = useState(todayKey())
  const [correctionOpen, setCorrectionOpen] = useState<Record<string, boolean>>({})
  const habits = useActiveHabits()
  const categories = useCategories()
  const records = useRecordsForDate(date)
  const { show } = useToast()

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const recordByHabit = useMemo(() => new Map(records.map((r) => [r.habitId, r])), [records])
  const scheduled = useMemo(() => habits.filter((h) => isHabitActiveOn(h, date)), [habits, date])

  const future = isFutureKey(date)
  const past = isPastKey(date)
  const unlocked = !!correctionOpen[date]
  const locked = future || (past && !unlocked)
  const lockedReason = future ? "Future days can't be tracked yet." : 'This past day is locked. Turn on Correction Mode to edit it.'

  const stats = completionStatsForDay(scheduled, records, date)

  async function handleSetSimple(habitId: string, status: 'completed' | 'missed' | 'clear') {
    try {
      if (status === 'clear') {
        await habitService.clearDayValue(habitId, date, { allowPastEdit: unlocked })
      } else {
        await habitService.setDayValue(habitId, date, { status }, { allowPastEdit: unlocked })
      }
    } catch (e) {
      if (e instanceof LockedDayError) show(e.message, 'error')
      else show('Something went wrong saving that.', 'error')
    }
  }

  async function handleSetValue(habitId: string, value: number) {
    try {
      await habitService.setDayValue(habitId, date, { actualValue: value }, { allowPastEdit: unlocked })
    } catch (e) {
      if (e instanceof LockedDayError) show(e.message, 'error')
      else show('Something went wrong saving that.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink dark:text-paper">
          <Sparkles className="h-5 w-5 text-ember-500" />
          {greetingForNow()}
        </h1>
        <p className="text-sm text-ink-soft dark:text-paper/60">
          {stats.total === 0
            ? 'Nothing scheduled for this day.'
            : `${stats.completed} completed · ${stats.total - stats.completed} remaining`}
        </p>
      </div>

      <DateNav date={date} onChange={setDate} />

      {stats.total > 0 && <SegmentedBar pct={stats.pct} color="bg-growth-500" />}

      {future && (
        <div className="flex items-center gap-2 rounded-md border border-black/10 bg-paper-sunken px-3 py-2.5 text-sm text-ink-soft dark:border-white/10 dark:bg-dark-surface2 dark:text-paper/60">
          <Lock className="h-4 w-4 shrink-0" />
          You're viewing a future day. Come back on the day itself to track it.
        </div>
      )}

      {past && (
        <div className="space-y-2">
          {!unlocked ? (
            <button
              onClick={() => setCorrectionOpen((c) => ({ ...c, [date]: true }))}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-black/15 px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-black/5 dark:border-white/15 dark:text-paper/60 dark:hover:bg-white/5"
            >
              <Lock className="h-4 w-4" /> This day is locked — turn on Correction Mode to edit it
            </button>
          ) : (
            <div className="space-y-2 rounded-md border border-ember-500/30 bg-ember-50 px-3 py-2.5 text-sm dark:bg-ember-500/10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-ember-600 dark:text-ember-300">
                  <Unlock className="h-4 w-4" /> Correction Mode is on for {date}
                </span>
                <button
                  onClick={() => setCorrectionOpen((c) => ({ ...c, [date]: false }))}
                  className="text-xs font-medium text-ember-600 hover:underline dark:text-ember-300"
                >
                  Lock this day again
                </button>
              </div>
              <p className="flex items-start gap-1.5 text-xs text-ink-soft dark:text-paper/60">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Changes here can affect streaks, completion percentages, and monthly reports.
              </p>
            </div>
          )}
        </div>
      )}

      {scheduled.length === 0 ? (
        <EmptyState icon={ListChecks} title="No habits today" message="Create your first habit to start tracking your progress." />
      ) : (
        <div className="space-y-2">
          {scheduled.map((habit) => {
            const category = categoryById.get(habit.categoryId)
            return (
              <div
                key={habit.id}
                className="flex items-center gap-3 rounded-md border border-black/5 bg-paper-raised px-3 py-3 dark:border-white/5 dark:bg-dark-surface"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg"
                  style={{ backgroundColor: `${habit.color}22` }}
                  aria-hidden="true"
                >
                  {habit.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink dark:text-paper">{habit.name}</p>
                  {category && <p className="truncate text-xs text-ink-soft/60 dark:text-paper/40">{category.name}</p>}
                </div>
                <HabitCompletionControl
                  habit={habit}
                  record={recordByHabit.get(habit.id)}
                  locked={locked}
                  lockedReason={lockedReason}
                  onSetSimple={(status) => handleSetSimple(habit.id, status)}
                  onSetValue={(value) => handleSetValue(habit.id, value)}
                />
              </div>
            )
          })}
        </div>
      )}

      <Card>
        <h2 className="mb-2 font-display text-sm font-bold text-ink dark:text-paper">Daily note</h2>
        <DailyNoteEditor date={date} />
      </Card>
    </div>
  )
}
