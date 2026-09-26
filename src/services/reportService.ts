import { db, ensureSeeded } from '@/db/database'
import type { MonthlyReportSnapshot } from '@/types'
import { habitService } from './habitService'
import { statisticsService } from './statisticsService'
import { compareValues, currentStreak, longestStreak } from '@/utils/calculations'
import { daysBetweenKeys, monthLabel, previousMonthOf, todayKey } from '@/utils/dates'

function monthDateRange(year: number, month: number): string[] {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return daysBetweenKeys(start, end)
}

export const reportService = {
  /** Builds (and persists, per the user's retention setting) a monthly report snapshot. */
  async generateMonthlyReport(year: number, month: number): Promise<MonthlyReportSnapshot> {
    const dateKeys = monthDateRange(year, month)
    const performances = await statisticsService.performanceForRange(dateKeys)

    const habits = await habitService.listActive()
    const habitRecordsMap = new Map<string, number>()
    let totalAchieved = 0
    let totalMissed = 0
    for (const p of performances) {
      totalAchieved += p.stats.completed
      totalMissed += p.stats.missed
      habitRecordsMap.set(p.habit.id, p.stats.pct)
    }

    const { best, least } = statisticsService.bestAndLeast(performances)
    const overallPct = statisticsService.overallPct(performances)

    let bestCurrentStreak = 0
    let bestLongestStreak = 0
    for (const habit of habits) {
      const records = await habitService.getRecordsForHabit(habit.id)
      bestCurrentStreak = Math.max(bestCurrentStreak, currentStreak(habit, records))
      bestLongestStreak = Math.max(bestLongestStreak, longestStreak(habit, records))
    }

    const snapshot: MonthlyReportSnapshot = {
      id: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      generatedAt: new Date().toISOString(),
      overallCompletionPct: overallPct,
      totalGoalsAchieved: totalAchieved,
      totalGoalsMissed: totalMissed,
      currentStreak: bestCurrentStreak,
      longestStreak: bestLongestStreak,
      bestHabitId: best?.habit.id,
      leastHabitId: least?.habit.id,
      habitBreakdown: performances.map((p) => ({
        habitId: p.habit.id,
        completionPct: p.stats.pct,
        completedDays: p.stats.completed,
        missedDays: p.stats.missed,
      })),
    }

    await this.saveReport(snapshot)
    return snapshot
  },

  async saveReport(snapshot: MonthlyReportSnapshot): Promise<void> {
    await db.monthlyReports.put(snapshot)
    await this.applyRetention()
  },

  async listReports(): Promise<MonthlyReportSnapshot[]> {
    const reports = await db.monthlyReports.toArray()
    return reports.sort((a, b) => (a.id < b.id ? 1 : -1))
  },

  async getReport(year: number, month: number): Promise<MonthlyReportSnapshot | undefined> {
    return db.monthlyReports.get(`${year}-${String(month).padStart(2, '0')}`)
  },

  /** Removes older reports according to Settings > Reports retention choice. */
  async applyRetention(): Promise<void> {
    await ensureSeeded()
    const settings = await db.settings.get('settings')
    const policy = settings?.reportRetention ?? 'last12'
    if (policy === 'all') return
    const keep = policy === 'last12' ? 12 : policy === 'last6' ? 6 : 3
    const all = await this.listReports()
    const toDelete = all.slice(keep)
    if (toDelete.length > 0) {
      await db.monthlyReports.bulkDelete(toDelete.map((r) => r.id))
    }
  },

  async previousMonthComparison(year: number, month: number) {
    const current = await this.getReport(year, month)
    const prev = previousMonthOf(year, month)
    const previous = await this.getReport(prev.year, prev.month)
    if (!current) return null
    return {
      current,
      previous,
      completion: compareValues(current.overallCompletionPct, previous?.overallCompletionPct ?? 0),
      goalsAchieved: compareValues(current.totalGoalsAchieved, previous?.totalGoalsAchieved ?? 0),
      hasPrevious: !!previous,
    }
  },

  /** Renders a monthly report as a simple, printable PDF using jsPDF (loaded on demand). */
  async exportReportPdf(snapshot: MonthlyReportSnapshot, habitNames: Map<string, string>): Promise<void> {
    const { default: jsPDF } = await import('jspdf')
    const docPdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 48
    let y = margin

    docPdf.setFont('helvetica', 'bold')
    docPdf.setFontSize(20)
    docPdf.text('Monthly Habit Report', margin, y)
    y += 28

    docPdf.setFontSize(13)
    docPdf.setFont('helvetica', 'normal')
    docPdf.text(monthLabel(snapshot.year, snapshot.month), margin, y)
    y += 30

    const summary: [string, string][] = [
      ['Overall completion', `${snapshot.overallCompletionPct}%`],
      ['Goals achieved', `${snapshot.totalGoalsAchieved}`],
      ['Goals missed', `${snapshot.totalGoalsMissed}`],
      ['Best current streak', `${snapshot.currentStreak} days`],
      ['Best longest streak', `${snapshot.longestStreak} days`],
      ['Best-performing habit', snapshot.bestHabitId ? habitNames.get(snapshot.bestHabitId) ?? '—' : '—'],
      ['Least-completed habit', snapshot.leastHabitId ? habitNames.get(snapshot.leastHabitId) ?? '—' : '—'],
    ]

    docPdf.setFontSize(11)
    for (const [label, value] of summary) {
      docPdf.setFont('helvetica', 'bold')
      docPdf.text(label, margin, y)
      docPdf.setFont('helvetica', 'normal')
      docPdf.text(value, margin + 200, y)
      y += 20
    }

    y += 16
    docPdf.setFont('helvetica', 'bold')
    docPdf.setFontSize(14)
    docPdf.text('Habit-by-habit performance', margin, y)
    y += 22
    docPdf.setFontSize(11)

    for (const row of snapshot.habitBreakdown) {
      if (y > 760) {
        docPdf.addPage()
        y = margin
      }
      const name = habitNames.get(row.habitId) ?? 'Unknown habit'
      docPdf.setFont('helvetica', 'bold')
      docPdf.text(name, margin, y)
      docPdf.setFont('helvetica', 'normal')
      docPdf.text(
        `${row.completionPct}%  ·  ${row.completedDays} completed  ·  ${row.missedDays} missed`,
        margin + 200,
        y,
      )
      y += 18
    }

    docPdf.save(`habit-report-${snapshot.id}.pdf`)
  },
}

export function currentMonthKey(): { year: number; month: number } {
  const d = new Date(todayKey())
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}
