import Dexie, { type Table } from 'dexie'
import type {
  Habit,
  HabitVersion,
  DailyRecord,
  DailyNote,
  Category,
  DashboardLayout,
  AppSettings,
  MonthlyReportSnapshot,
} from '@/types'
import { DEFAULT_CATEGORIES } from './defaultCategories'
import { DEFAULT_WIDGETS } from './defaultDashboard'

// A single IndexedDB database, local to this browser only. Nothing here is
// ever sent anywhere — see services/exportService.ts for the only way data
// leaves the device (manual JSON export).
export class HabitDatabase extends Dexie {
  habits!: Table<Habit, string>
  habitVersions!: Table<HabitVersion, string>
  records!: Table<DailyRecord, string>
  dailyNotes!: Table<DailyNote, string>
  categories!: Table<Category, string>
  dashboard!: Table<DashboardLayout, string>
  settings!: Table<AppSettings, string>
  monthlyReports!: Table<MonthlyReportSnapshot, string>

  constructor() {
    super('habit-tracker-db')

    this.version(1).stores({
      habits: 'id, categoryId, status, sortOrder',
      habitVersions: 'id, habitId, effectiveFrom',
      records: 'id, habitId, date, [habitId+date]',
      dailyNotes: 'id, date',
      categories: 'id, isCustom',
      dashboard: 'id',
      settings: 'id',
      monthlyReports: 'id, year, month',
    })
  }
}

export const db = new HabitDatabase()

let seedPromise: Promise<void> | null = null

/** Ensures categories, settings and dashboard rows exist. Safe to call many times. */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = db.transaction(
      'rw',
      db.categories,
      db.settings,
      db.dashboard,
      async () => {
        const catCount = await db.categories.count()
        if (catCount === 0) {
          await db.categories.bulkAdd(DEFAULT_CATEGORIES)
        }
        const settings = await db.settings.get('settings')
        if (!settings) {
          await db.settings.put({
            id: 'settings',
            theme: 'system',
            reminderEnabled: false,
            reminderTime: '21:00',
            retentionMonths: 6,
            reportRetention: 'last12',
            onboardingComplete: false,
          })
        }
        const dashboard = await db.dashboard.get('dashboard')
        if (!dashboard) {
          await db.dashboard.put({
            id: 'dashboard',
            widgets: DEFAULT_WIDGETS,
            updatedAt: new Date().toISOString(),
          })
        }
      },
    )
  }
  return seedPromise
}
