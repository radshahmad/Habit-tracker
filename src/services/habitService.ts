import { db, ensureSeeded } from '@/db/database'
import type { Category, DailyNote, DailyRecord, Habit, HabitVersion, TrackingType } from '@/types'
import { isFutureKey, isPastKey, todayKey } from '@/utils/dates'
import { isGoalAchieved } from '@/utils/calculations'

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export class LockedDayError extends Error {
  constructor(date: string, reason: 'future' | 'past') {
    super(
      reason === 'future'
        ? `${date} is in the future and can't be tracked yet.`
        : `${date} is a past day. Turn on Correction Mode for this day to edit it.`,
    )
    this.name = 'LockedDayError'
  }
}

export interface HabitInput {
  name: string
  description?: string
  icon: string
  color: string
  categoryId: string
  trackingType: TrackingType
  target?: number
  unit?: string
  startDate: string
  endDate?: string
  notes?: string
}

export const habitService = {
  async listActive(): Promise<Habit[]> {
    await ensureSeeded()
    const habits = await db.habits.where('status').equals('active').toArray()
    return habits.sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async listArchived(): Promise<Habit[]> {
    await ensureSeeded()
    return db.habits.where('status').equals('archived').toArray()
  },

  async get(id: string): Promise<Habit | undefined> {
    return db.habits.get(id)
  },

  async create(input: HabitInput): Promise<Habit> {
    const now = new Date().toISOString()
    const count = await db.habits.count()
    const habit: Habit = {
      id: newId('habit'),
      name: input.name.trim(),
      description: input.description?.trim(),
      icon: input.icon,
      color: input.color,
      categoryId: input.categoryId,
      trackingType: input.trackingType,
      target: input.trackingType === 'simple' ? undefined : input.target,
      unit: input.trackingType === 'simple' ? undefined : input.unit,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes?.trim(),
      sortOrder: count,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }
    const version: HabitVersion = {
      id: newId('hv'),
      habitId: habit.id,
      effectiveFrom: habit.startDate,
      name: habit.name,
      trackingType: habit.trackingType,
      target: habit.target,
      unit: habit.unit,
      color: habit.color,
      icon: habit.icon,
    }
    await db.transaction('rw', db.habits, db.habitVersions, async () => {
      await db.habits.add(habit)
      await db.habitVersions.add(version)
    })
    return habit
  },

  /**
   * Updates a habit. If any tracking-relevant field changes (name, tracking
   * type, target, unit, color, icon), a new HabitVersion is recorded
   * effective from today — historical records keep using whichever version
   * was in effect on their own date (see getEffectiveConfig).
   */
  async update(id: string, changes: Partial<HabitInput>): Promise<void> {
    const habit = await db.habits.get(id)
    if (!habit) throw new Error('Habit not found.')

    const trackingFieldsChanged =
      (changes.name !== undefined && changes.name.trim() !== habit.name) ||
      (changes.trackingType !== undefined && changes.trackingType !== habit.trackingType) ||
      (changes.target !== undefined && changes.target !== habit.target) ||
      (changes.unit !== undefined && changes.unit !== habit.unit) ||
      (changes.color !== undefined && changes.color !== habit.color) ||
      (changes.icon !== undefined && changes.icon !== habit.icon)

    const updated: Habit = {
      ...habit,
      ...changes,
      name: changes.name !== undefined ? changes.name.trim() : habit.name,
      updatedAt: new Date().toISOString(),
    }

    await db.transaction('rw', db.habits, db.habitVersions, async () => {
      await db.habits.put(updated)
      if (trackingFieldsChanged) {
        const today = todayKey()
        const existingToday = await db.habitVersions
          .where('habitId')
          .equals(id)
          .filter((v) => v.effectiveFrom === today)
          .first()
        const version: HabitVersion = {
          id: existingToday?.id ?? newId('hv'),
          habitId: id,
          effectiveFrom: today,
          name: updated.name,
          trackingType: updated.trackingType,
          target: updated.target,
          unit: updated.unit,
          color: updated.color,
          icon: updated.icon,
        }
        await db.habitVersions.put(version)
      }
    })
  },

  async reorder(orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.habits, async () => {
      await Promise.all(
        orderedIds.map((id, index) => db.habits.update(id, { sortOrder: index, updatedAt: new Date().toISOString() })),
      )
    })
  },

  async archive(id: string): Promise<void> {
    await db.habits.update(id, { status: 'archived', updatedAt: new Date().toISOString() })
  },

  async restore(id: string): Promise<void> {
    await db.habits.update(id, { status: 'active', updatedAt: new Date().toISOString() })
  },

  /** keepHistory=true behaves like a permanent archive; false purges everything. */
  async remove(id: string, keepHistory: boolean): Promise<void> {
    if (keepHistory) {
      await this.archive(id)
      return
    }
    await db.transaction('rw', db.habits, db.habitVersions, db.records, async () => {
      await db.records.where('habitId').equals(id).delete()
      await db.habitVersions.where('habitId').equals(id).delete()
      await db.habits.delete(id)
    })
  },

  /** Resolves which config (target/unit/trackingType/etc) applied on a given date. */
  async getEffectiveConfig(habitId: string, date: string): Promise<HabitVersion | undefined> {
    const versions = await db.habitVersions.where('habitId').equals(habitId).toArray()
    if (versions.length === 0) return undefined
    const applicable = versions.filter((v) => v.effectiveFrom <= date).sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))
    return applicable[0] ?? versions.sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))[0]
  },

  async getRecordsForHabit(habitId: string): Promise<DailyRecord[]> {
    return db.records.where('habitId').equals(habitId).toArray()
  },

  async getRecordsForHabits(habitIds: string[]): Promise<DailyRecord[]> {
    if (habitIds.length === 0) return []
    return db.records.where('habitId').anyOf(habitIds).toArray()
  },

  async getRecordsForDate(date: string): Promise<DailyRecord[]> {
    return db.records.where('date').equals(date).toArray()
  },

  async getRecord(habitId: string, date: string): Promise<DailyRecord | undefined> {
    return db.records.where('[habitId+date]').equals([habitId, date]).first()
  },

  /**
   * Sets a day's completion. Enforces: future days always locked; past days
   * locked unless `allowPastEdit` (the UI's Correction Mode) is passed for
   * that specific day.
   */
  async setDayValue(
    habitId: string,
    date: string,
    input: { status?: 'completed' | 'missed'; actualValue?: number },
    opts: { allowPastEdit?: boolean } = {},
  ): Promise<DailyRecord> {
    if (isFutureKey(date)) throw new LockedDayError(date, 'future')
    if (isPastKey(date) && !opts.allowPastEdit) throw new LockedDayError(date, 'past')

    const config = await this.getEffectiveConfig(habitId, date)
    const now = new Date().toISOString()
    const existing = await this.getRecord(habitId, date)

    let status: 'completed' | 'missed' | 'pending'
    let actualValue = input.actualValue

    if (config && config.trackingType !== 'simple') {
      // Measurable habit: status is derived from actual vs. target, except
      // an explicit "mark missed" always wins.
      actualValue = input.actualValue ?? existing?.actualValue ?? 0
      if (input.status === 'missed') {
        status = 'missed'
      } else if (isGoalAchieved(config.trackingType, config.target, actualValue)) {
        status = 'completed'
      } else {
        status = 'pending'
      }
    } else {
      status = input.status ?? 'pending'
    }

    const record: DailyRecord = {
      id: existing?.id ?? newId('rec'),
      habitId,
      date,
      status,
      actualValue,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.records.put(record)
    return record
  },

  async clearDayValue(habitId: string, date: string, opts: { allowPastEdit?: boolean } = {}): Promise<void> {
    if (isFutureKey(date)) throw new LockedDayError(date, 'future')
    if (isPastKey(date) && !opts.allowPastEdit) throw new LockedDayError(date, 'past')
    const existing = await this.getRecord(habitId, date)
    if (existing) await db.records.delete(existing.id)
  },

  async listCategories(): Promise<Category[]> {
    await ensureSeeded()
    return db.categories.toArray()
  },

  async createCategory(name: string, icon: string, color: string): Promise<Category> {
    const category: Category = {
      id: newId('cat'),
      name: name.trim(),
      icon,
      color,
      isCustom: true,
      createdAt: new Date().toISOString(),
    }
    await db.categories.add(category)
    return category
  },

  async getNote(date: string): Promise<DailyNote | undefined> {
    return db.dailyNotes.where('date').equals(date).first()
  },

  async setNote(date: string, content: string): Promise<void> {
    const existing = await this.getNote(date)
    const note: DailyNote = {
      id: existing?.id ?? newId('note'),
      date,
      content,
      updatedAt: new Date().toISOString(),
    }
    await db.dailyNotes.put(note)
  },
}
