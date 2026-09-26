import type { DashboardWidgetId } from '@/types'
import type { WidgetProps } from './widgetTypes'
import { TodaysProgressWidget, HabitCompletionWidget } from './ProgressWidgets'
import { CurrentStreakWidget, LongestStreakWidget } from './StreakWidgets'
import { WeeklyProgressWidget, MonthlyProgressWidget } from './ProgressTrendWidgets'
import { GoalVsActualWidget } from './GoalVsActualWidget'
import { CalendarHeatmapWidget } from './CalendarHeatmapWidget'
import { BestHabitsWidget, LeastHabitsWidget } from './PerformanceListWidgets'
import { RecentActivityWidget } from './RecentActivityWidget'
import { DailyNoteWidget, MonthlyComparisonWidget } from './MiscWidgets'

export const WIDGET_REGISTRY: Record<DashboardWidgetId, { title: string; component: React.ComponentType<WidgetProps> }> = {
  todaysProgress: { title: "Today's Progress", component: TodaysProgressWidget },
  habitCompletion: { title: 'Habit Completion', component: HabitCompletionWidget },
  currentStreak: { title: 'Current Streak', component: CurrentStreakWidget },
  longestStreak: { title: 'Longest Streak', component: LongestStreakWidget },
  weeklyProgress: { title: 'Weekly Progress', component: WeeklyProgressWidget },
  monthlyProgress: { title: 'Monthly Progress', component: MonthlyProgressWidget },
  goalVsActual: { title: 'Goal vs Actual', component: GoalVsActualWidget },
  calendarHeatmap: { title: 'Calendar Heatmap', component: CalendarHeatmapWidget },
  bestHabits: { title: 'Best-performing Habits', component: BestHabitsWidget },
  leastHabits: { title: 'Least-completed Habits', component: LeastHabitsWidget },
  recentActivity: { title: 'Recent Activity', component: RecentActivityWidget },
  dailyNote: { title: 'Daily Note', component: DailyNoteWidget },
  monthlyComparison: { title: 'Monthly Comparison', component: MonthlyComparisonWidget },
}
