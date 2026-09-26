import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/common/Card'
import { DailyNoteEditor } from '@/components/common/DailyNoteEditor'
import { statisticsService } from '@/services/statisticsService'
import { compareValues } from '@/utils/calculations'
import { monthLabel, monthRangeForKey, previousMonthOf, todayKey, daysBetweenKeys } from '@/utils/dates'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WidgetProps } from './widgetTypes'

export function DailyNoteWidget({ size }: WidgetProps = {}) {
  return (
    <Card span={size ?? 'medium'}>
      <CardTitle>Daily Note</CardTitle>
      <DailyNoteEditor date={todayKey()} compact />
    </Card>
  )
}

export function MonthlyComparisonWidget({ size }: WidgetProps = {}) {
  const [state, setState] = useState<{ currentPct: number; previousPct: number; label: string; prevLabel: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const today = todayKey()
      const d = new Date(today)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      const { start } = monthRangeForKey(today)
      const currentDays = daysBetweenKeys(start, today)
      const currentPerf = await statisticsService.performanceForRange(currentDays)
      const currentPct = statisticsService.overallPct(currentPerf)

      const prev = previousMonthOf(year, month)
      const prevRange = monthRangeForKey(`${prev.year}-${String(prev.month).padStart(2, '0')}-01`)
      // Compare against the same number of days into the previous month for fairness.
      const sameLength = currentDays.length
      const prevDays = daysBetweenKeys(prevRange.start, prevRange.end).slice(0, sameLength)
      const prevPerf = await statisticsService.performanceForRange(prevDays)
      const previousPct = statisticsService.overallPct(prevPerf)

      if (!cancelled) {
        setState({ currentPct, previousPct, label: monthLabel(year, month), prevLabel: monthLabel(prev.year, prev.month) })
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (!state) return null
  const { direction, deltaAbs } = compareValues(state.currentPct, state.previousPct)
  const Icon = direction === 'increased' ? TrendingUp : direction === 'decreased' ? TrendingDown : Minus
  const tone = direction === 'increased' ? 'text-growth-600 dark:text-growth-300' : direction === 'decreased' ? 'text-brick-500' : 'text-ink-soft'

  return (
    <Card span={size ?? 'large'}>
      <CardTitle action={<Link to="/reports" className="text-xs font-medium text-growth-600 hover:underline dark:text-growth-300">Full report</Link>}>
        Monthly Comparison
      </CardTitle>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-soft/60 dark:text-paper/40">{state.label} (so far)</p>
          <p className="font-display text-2xl font-extrabold text-ink dark:text-paper">{state.currentPct}%</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft/60 dark:text-paper/40">{state.prevLabel} (same span)</p>
          <p className="font-display text-2xl font-extrabold text-ink-soft dark:text-paper/60">{state.previousPct}%</p>
        </div>
        <div className={`flex items-center gap-1.5 ${tone}`}>
          <Icon className="h-5 w-5" />
          <span className="text-sm font-semibold">
            {direction === 'unchanged' ? 'No change' : `${Math.abs(deltaAbs)} pt ${direction}`}
          </span>
        </div>
      </div>
    </Card>
  )
}
