import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeeded } from '@/db/database'
import type { DailyRecord, Habit } from '@/types'

export function useActiveHabits(): Habit[] {
  const habits = useLiveQuery(async () => {
    await ensureSeeded()
    const list = await db.habits.where('status').equals('active').toArray()
    return list.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [])
  return habits ?? []
}

export function useArchivedHabits(): Habit[] {
  const habits = useLiveQuery(() => db.habits.where('status').equals('archived').toArray(), [])
  return habits ?? []
}

export function useCategories() {
  const categories = useLiveQuery(async () => {
    await ensureSeeded()
    return db.categories.toArray()
  }, [])
  return categories ?? []
}

export function useRecordsForDate(date: string): DailyRecord[] {
  const records = useLiveQuery(() => db.records.where('date').equals(date).toArray(), [date])
  return records ?? []
}

export function useRecordsForHabits(habitIds: string[]): DailyRecord[] {
  const key = habitIds.join(',')
  const records = useLiveQuery(() => {
    if (habitIds.length === 0) return Promise.resolve([] as DailyRecord[])
    return db.records.where('habitId').anyOf(habitIds).toArray()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return records ?? []
}

export function useDailyNote(date: string) {
  const note = useLiveQuery(() => db.dailyNotes.where('date').equals(date).first(), [date])
  return note
}
