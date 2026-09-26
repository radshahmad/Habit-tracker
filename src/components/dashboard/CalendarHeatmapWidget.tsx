import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/common/Card'
import { statisticsService } from '@/services/statisticsService'
import { daysBetweenKeys, formatFriendly, subDaysFromKey, todayKey } from '@/utils/dates'
import type { WidgetProps } from './widgetTypes'

const WEEKS = 14 // ~3.5 months, keeps the grid compact but useful

function colorForPct(pct: number, hasData: boolean): string {
  if (!hasData) return 'bg-paper-sunken dark:bg-dark-surface2'
  if (pct === 0) return 'bg-brick-400/40'
  if (pct < 50) return 'bg-growth-100 dark:bg-growth-500/20'
  if (pct < 100) return 'bg-growth-300 dark:bg-growth-500/50'
  return 'bg-growth-500'
}

export function CalendarHeatmapWidget({ size }: WidgetProps = {}) {
  const [days, setDays] = useState<{ date: string; pct: number }[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const today = todayKey()
      const start = subDaysFromKey(today, WEEKS * 7 - 1)
      const range = daysBetweenKeys(start, today)
      const trend = await statisticsService.dailyTrend(range)
      if (!cancelled) setDays(trend)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  // Pad the front so the grid starts on a Monday column.
  const first = days[0]?.date
  const padCount = first ? (new Date(first).getDay() + 6) % 7 : 0
  const padded = [...Array(padCount).fill(null), ...days]
  const weeks: (typeof days[number] | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  return (
    <Card span={size ?? 'large'}>
      <CardTitle>Calendar Heatmap</CardTitle>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  title={`${formatFriendly(day.date)} — ${day.pct}%`}
                  className={`h-3 w-3 rounded-[2px] ${colorForPct(day.pct, true)}`}
                />
              ) : (
                <div key={di} className="h-3 w-3 rounded-[2px] bg-transparent" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-ink-soft/50 dark:text-paper/30">
        Less
        <div className="h-2.5 w-2.5 rounded-[2px] bg-paper-sunken dark:bg-dark-surface2" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-growth-100 dark:bg-growth-500/20" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-growth-300 dark:bg-growth-500/50" />
        <div className="h-2.5 w-2.5 rounded-[2px] bg-growth-500" />
        More
      </div>
    </Card>
  )
}
