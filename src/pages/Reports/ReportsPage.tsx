import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { SegmentedBar } from '@/components/common/SegmentedBar'
import { useActiveHabits, useArchivedHabits } from '@/hooks/useHabits'
import { reportService, currentMonthKey } from '@/services/reportService'
import { compareValues } from '@/utils/calculations'
import { monthLabel, previousMonthOf } from '@/utils/dates'
import { useToast } from '@/components/common/Toast'
import type { MonthlyReportSnapshot } from '@/types'

export default function ReportsPage() {
  const [{ year, month }, setYm] = useState(currentMonthKey())
  const [report, setReport] = useState<MonthlyReportSnapshot | null>(null)
  const [previous, setPrevious] = useState<MonthlyReportSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const activeHabits = useActiveHabits()
  const archivedHabits = useArchivedHabits()
  const { show } = useToast()

  const habitNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const h of [...activeHabits, ...archivedHabits]) map.set(h.id, h.name)
    return map
  }, [activeHabits, archivedHabits])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const snapshot = await reportService.generateMonthlyReport(year, month)
      const prev = previousMonthOf(year, month)
      const prevSnapshot = await reportService.getReport(prev.year, prev.month)
      if (!cancelled) {
        setReport(snapshot)
        setPrevious(prevSnapshot ?? null)
        setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [year, month])

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYm({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  async function handleExportPdf() {
    if (!report) return
    try {
      await reportService.exportReportPdf(report, habitNames)
      show('PDF downloaded.', 'success')
    } catch {
      show("Couldn't generate the PDF. Try again.", 'error')
    }
  }

  const completionComparison = previous ? compareValues(report?.overallCompletionPct ?? 0, previous.overallCompletionPct) : null
  const goalsComparison = previous ? compareValues(report?.totalGoalsAchieved ?? 0, previous.totalGoalsAchieved) : null

  if (activeHabits.length === 0 && archivedHabits.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Reports</h1>
        <EmptyState icon={FileText} title="No monthly report" message="Complete some days this month to generate your report." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Reports</h1>
        <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />} onClick={handleExportPdf} disabled={loading || !report}>
          Export PDF
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-sm font-bold">{monthLabel(year, month)}</span>
        <button onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {report && report.habitBreakdown.length === 0 ? (
        <EmptyState icon={FileText} title="No monthly report" message="Complete some days this month to generate your report." />
      ) : (
        <>
          <Card span="large">
            <CardTitle>Overview</CardTitle>
            <SegmentedBar pct={report?.overallCompletionPct ?? 0} size="lg" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Goals achieved" value={report?.totalGoalsAchieved ?? 0} />
              <Metric label="Goals missed" value={report?.totalGoalsMissed ?? 0} />
              <Metric label="Best streak" value={report?.longestStreak ?? 0} />
              <Metric label="Current streak" value={report?.currentStreak ?? 0} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardTitle>Best-performing habit</CardTitle>
              <p className="text-lg font-semibold">
                {report?.bestHabitId ? habitNames.get(report.bestHabitId) ?? '—' : 'Not enough data'}
              </p>
            </Card>
            <Card>
              <CardTitle>Least-completed habit</CardTitle>
              <p className="text-lg font-semibold">
                {report?.leastHabitId ? habitNames.get(report.leastHabitId) ?? '—' : 'Not enough data'}
              </p>
            </Card>
          </div>

          <Card span="large">
            <CardTitle>Compared with previous month</CardTitle>
            {!previous ? (
              <p className="text-sm text-ink-soft dark:text-paper/60">No report for the previous month yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <ComparisonRow label="Overall completion" comparison={completionComparison} suffix="pt" />
                <ComparisonRow label="Goals achieved" comparison={goalsComparison} suffix="" />
              </div>
            )}
          </Card>

          <Card span="large">
            <CardTitle>Habit-by-habit performance</CardTitle>
            <div className="space-y-3">
              {report?.habitBreakdown.map((row) => (
                <div key={row.habitId}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{habitNames.get(row.habitId) ?? 'Unknown habit'}</span>
                    <span className="text-ink-soft/70 dark:text-paper/50">
                      {row.completedDays} completed · {row.missedDays} missed
                    </span>
                  </div>
                  <SegmentedBar pct={row.completionPct} segments={16} size="sm" showPct={false} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-xl font-extrabold tabular-nums text-ink dark:text-paper">{value}</p>
      <p className="text-xs text-ink-soft/60 dark:text-paper/40">{label}</p>
    </div>
  )
}

function ComparisonRow({
  label,
  comparison,
  suffix,
}: {
  label: string
  comparison: ReturnType<typeof compareValues> | null
  suffix: string
}) {
  if (!comparison) return null
  const Icon = comparison.direction === 'increased' ? TrendingUp : comparison.direction === 'decreased' ? TrendingDown : Minus
  const tone =
    comparison.direction === 'increased'
      ? 'text-growth-600 dark:text-growth-300'
      : comparison.direction === 'decreased'
        ? 'text-brick-500'
        : 'text-ink-soft'
  return (
    <div>
      <p className="text-xs text-ink-soft/60 dark:text-paper/40">{label}</p>
      <p className={`flex items-center gap-1.5 font-display text-lg font-bold ${tone}`}>
        <Icon className="h-4 w-4" />
        {comparison.direction === 'unchanged' ? 'No change' : `${Math.abs(comparison.deltaAbs)}${suffix ? ` ${suffix}` : ''}`}
      </p>
    </div>
  )
}
