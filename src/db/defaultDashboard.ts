import type { DashboardWidgetConfig } from '@/types'

// Order here defines default visual order. Users can hide, reorder, and
// resize from the Dashboard page; "Reset to Default" restores exactly this.
export const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'todaysProgress', visible: true, order: 0, size: 'large' },
  { id: 'habitCompletion', visible: true, order: 1, size: 'medium' },
  { id: 'currentStreak', visible: true, order: 2, size: 'small' },
  { id: 'longestStreak', visible: true, order: 3, size: 'small' },
  { id: 'weeklyProgress', visible: true, order: 4, size: 'medium' },
  { id: 'monthlyProgress', visible: true, order: 5, size: 'medium' },
  { id: 'goalVsActual', visible: true, order: 6, size: 'medium' },
  { id: 'calendarHeatmap', visible: true, order: 7, size: 'large' },
  { id: 'bestHabits', visible: true, order: 8, size: 'small' },
  { id: 'leastHabits', visible: true, order: 9, size: 'small' },
  { id: 'recentActivity', visible: true, order: 10, size: 'medium' },
  { id: 'dailyNote', visible: true, order: 11, size: 'medium' },
  { id: 'monthlyComparison', visible: true, order: 12, size: 'large' },
]
