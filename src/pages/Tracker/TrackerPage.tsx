import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Unlock, ListChecks } from 'lucide-react'
import { HabitCompletionControl } from '@/components/tracker/HabitCompletionControl'
import { EmptyState } from '@/components/common/EmptyState'
import { useActiveHabits, useCategories, useRecordsForHabits } from '@/hooks/useHabits'
import { habitService, LockedDayError } from '@/services/habitService'
import { useToast } from '@/components/common/Toast'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { isHabitActiveOn } from '@/utils/calculations'
import {
  addDaysToKey,
  daysBetweenKeys,
  formatShort,
  isFutureKey,
  isPastKey,
  isTodayKey,
  subDaysFromKey,
  todayKey,
  weekRangeForKey,
} from '@/utils/dates'

export default function TrackerPage() {
  const [anchor, setAnchor] = useState(todayKey())
  const [correctionOpen, setCorrectionOpen] = useState<Record<string, boolean>>({})
  const habits = useActiveHabits()
  const categories = useCategories()
  const records = useRecordsForHabits(habits.map((h) => h.id))
  const isDesktop = useIsDesktop()
  const { show } = useToast()

  const { start, end } = weekRangeForKey(anchor)
  const days = useMemo(() => daysBetweenKeys(start, end), [start, end])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const recordsByHabitDate = useMemo(() => {
    const map = new Map<string, (typeof records)[number]>()
    for (const r of records) map.set(`${r.habitId}|${r.date}`, r)
    return map
  }, [records])

  async function setSimple(habitId: string, date: string, status: 'completed' | 'missed' | 'clear', unlocked: boolean) {
    try {
      if (status === 'clear') await habitService.clearDayValue(habitId, date, { allowPastEdit: unlocked })
      else await habitService.setDayValue(habitId, date, { status }, { allowPastEdit: unlocked })
    } catch (e) {
      show(e instanceof LockedDayError ? e.message : 'Something went wrong saving that.', 'error')
    }
  }

  async function setValue(habitId: string, date: string, value: number, unlocked: boolean) {
    try {
      await habitService.setDayValue(habitId, date, { actualValue: value }, { allowPastEdit: unlocked })
    } catch (e) {
      show(e instanceof LockedDayError ? e.message : 'Something went wrong saving that.', 'error')
    }
  }

  function lockStateFor(date: string) {
    const future = isFutureKey(date)
    const past = isPastKey(date)
    const unlocked = !!correctionOpen[date]
    return { locked: future || (past && !unlocked), future, past, unlocked }
  }

  if (habits.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Tracker</h1>
        <EmptyState icon={ListChecks} title="No habits yet" message="Create your first habit to start tracking your progress." />
      </div>
    )
  }

  const weekLabel = `${formatShort(start)} – ${formatShort(end)}`

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Tracker</h1>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous week"
            onClick={() => setAnchor((a) => subDaysFromKey(a, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink-soft dark:text-paper/60">{weekLabel}</span>
          <button
            aria-label="Next week"
            onClick={() => setAnchor((a) => addDaysToKey(a, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isDesktop ? (
        <div className="overflow-x-auto rounded-lg border border-black/5 dark:border-white/5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="w-48 px-3 py-2.5 text-left font-display text-xs font-bold text-ink-soft dark:text-paper/60">Habit</th>
                {days.map((date) => {
                  const { past, unlocked } = lockStateFor(date)
                  return (
                    <th key={date} className="px-2 py-2.5 text-center">
                      <div className={`text-xs font-bold ${isTodayKey(date) ? 'text-growth-600 dark:text-growth-300' : 'text-ink-soft dark:text-paper/60'}`}>
                        {formatShort(date)}
                      </div>
                      {past && (
                        <button
                          onClick={() => setCorrectionOpen((c) => ({ ...c, [date]: !unlocked }))}
                          className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-ink-soft/50 hover:text-ember-500 dark:text-paper/30"
                          aria-label={unlocked ? `Lock ${date}` : `Unlock ${date} for correction`}
                        >
                          {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base" aria-hidden="true">{habit.icon}</span>
                      <span className="truncate font-medium text-ink dark:text-paper">{habit.name}</span>
                    </div>
                  </td>
                  {days.map((date) => {
                    if (!isHabitActiveOn(habit, date)) return <td key={date} className="px-2 py-2 text-center text-ink-soft/20">·</td>
                    const { locked, future, unlocked } = lockStateFor(date)
                    const record = recordsByHabitDate.get(`${habit.id}|${date}`)
                    return (
                      <td key={date} className="px-2 py-2">
                        <div className="flex justify-center">
                          <HabitCompletionControl
                            habit={habit}
                            record={record}
                            locked={locked}
                            lockedReason={future ? "Future days can't be tracked yet." : 'Locked — unlock this day above to edit.'}
                            compact
                            onSetSimple={(status) => setSimple(habit.id, date, status, unlocked)}
                            onSetValue={(value) => setValue(habit.id, date, value, unlocked)}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((date) => {
            const { locked, future, unlocked, past } = lockStateFor(date)
            const scheduled = habits.filter((h) => isHabitActiveOn(h, date))
            if (scheduled.length === 0) return null
            return (
              <div key={date} className="rounded-lg border border-black/5 bg-paper-raised p-3 dark:border-white/5 dark:bg-dark-surface">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-display text-sm font-bold ${isTodayKey(date) ? 'text-growth-600 dark:text-growth-300' : ''}`}>
                    {formatShort(date)}
                  </span>
                  {past && (
                    <button
                      onClick={() => setCorrectionOpen((c) => ({ ...c, [date]: !unlocked }))}
                      className="flex items-center gap-1 text-xs text-ink-soft/60 dark:text-paper/40"
                    >
                      {unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {scheduled.map((habit) => {
                    const record = recordsByHabitDate.get(`${habit.id}|${date}`)
                    const category = categoryById.get(habit.categoryId)
                    return (
                      <div key={habit.id} className="flex items-center gap-2">
                        <span className="text-base" aria-hidden="true">{habit.icon}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                        <HabitCompletionControl
                          habit={habit}
                          record={record}
                          locked={locked}
                          lockedReason={future ? "Future days can't be tracked yet." : 'Locked — tap Locked above to enable Correction Mode.'}
                          onSetSimple={(status) => setSimple(habit.id, date, status, unlocked)}
                          onSetValue={(value) => setValue(habit.id, date, value, unlocked)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
