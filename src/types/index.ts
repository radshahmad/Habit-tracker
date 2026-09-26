// Core domain types for the habit tracker.
// Dates are always stored as "YYYY-MM-DD" local-calendar-day strings — never as
// UTC timestamps — so that day boundaries match the user's own calendar,
// regardless of timezone or daylight-saving transitions. See utils/dates.ts.

export type TrackingType = 'simple' | 'count' | 'duration' | 'quantity'

export type HabitStatus = 'active' | 'archived'

export type DayStatus = 'completed' | 'missed' | 'pending'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isCustom: boolean
  createdAt: string
}

export interface Habit {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  categoryId: string
  trackingType: TrackingType
  target?: number // required for count/duration/quantity
  unit?: string // e.g. "reps", "minutes", "pages", "glasses"
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD, optional
  notes?: string
  sortOrder: number
  status: HabitStatus
  // When archiving/deleting, the user chooses whether streak/history data
  // is kept for reporting purposes even though the habit itself is inactive.
  keepHistoryOnArchive?: boolean
  createdAt: string
  updatedAt: string
}

// Preserves a habit's configuration as of a point in time, so historical
// records keep using the rules that were in effect when they were recorded,
// even after the habit is edited going forward.
export interface HabitVersion {
  id: string
  habitId: string
  effectiveFrom: string // YYYY-MM-DD, inclusive
  name: string
  trackingType: TrackingType
  target?: number
  unit?: string
  color: string
  icon: string
}

export interface DailyRecord {
  id: string
  habitId: string
  date: string // YYYY-MM-DD
  status: DayStatus
  actualValue?: number // for measurable habits
  createdAt: string
  updatedAt: string
}

export interface DailyNote {
  id: string
  date: string // YYYY-MM-DD
  content: string
  updatedAt: string
}

export type DashboardWidgetId =
  | 'todaysProgress'
  | 'habitCompletion'
  | 'currentStreak'
  | 'longestStreak'
  | 'weeklyProgress'
  | 'monthlyProgress'
  | 'goalVsActual'
  | 'calendarHeatmap'
  | 'bestHabits'
  | 'leastHabits'
  | 'recentActivity'
  | 'dailyNote'
  | 'monthlyComparison'

export interface DashboardWidgetConfig {
  id: DashboardWidgetId
  visible: boolean
  order: number
  size: 'small' | 'medium' | 'large'
}

export interface DashboardLayout {
  id: 'dashboard' // singleton row
  widgets: DashboardWidgetConfig[]
  updatedAt: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
  id: 'settings' // singleton row
  theme: ThemeMode
  reminderEnabled: boolean
  reminderTime: string // "HH:mm"
  retentionMonths: number // default 6
  reportRetention: 'all' | 'last12' | 'last6' | 'last3'
  onboardingComplete: boolean
}

export interface MonthlyReportSnapshot {
  id: string // `${year}-${month}`
  year: number
  month: number // 1-12
  generatedAt: string
  overallCompletionPct: number
  totalGoalsAchieved: number
  totalGoalsMissed: number
  currentStreak: number
  longestStreak: number
  bestHabitId?: string
  leastHabitId?: string
  habitBreakdown: {
    habitId: string
    completionPct: number
    completedDays: number
    missedDays: number
  }[]
}

export interface ExportPayload {
  version: 1
  exportedAt: string
  habits: Habit[]
  habitVersions: HabitVersion[]
  categories: Category[]
  records: DailyRecord[]
  dailyNotes: DailyNote[]
  settings: AppSettings
  dashboard: DashboardLayout
  monthlyReports: MonthlyReportSnapshot[]
}
