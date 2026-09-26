import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardTitle } from '@/components/common/Card'
import { SegmentedBar } from '@/components/common/SegmentedBar'
import { statisticsService } from '@/services/statisticsService'
import { daysBetweenKeys, monthRangeForKey, todayKey, weekRangeForKey } from '@/utils/dates'
import { format } from 'date-fns'
import type { WidgetProps } from './widgetTypes'

export function WeeklyProgressWidget({ size }: WidgetProps = {}) {
  const [pct, setPct] = useState(0)
  const [trend, setTrend] = useState<{ date: string; pct: number }[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { start, end } = weekRangeForKey(todayKey())
      const days = daysBetweenKeys(start, end)
      const perf = await statisticsService.weeklyPerformance()
      const overall = statisticsService.overallPct(perf)
      const daily = await statisticsService.dailyTrend(days)
      if (!cancelled) {
        setPct(overall)
        setTrend(daily.map((d) => ({ date: format(new Date(d.date), 'EEE'), pct: d.pct })))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card span={size ?? 'medium'}>
      <CardTitle>Weekly Progress</CardTitle>
      <SegmentedBar pct={pct} color="bg-growth-500" />
      <div className="mt-3 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip formatter={(v: number) => [`${v}%`, 'Completed']} labelClassName="text-xs" />
            <Bar dataKey="pct" fill="#2F6F62" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function MonthlyProgressWidget({ size }: WidgetProps = {}) {
  const [pct, setPct] = useState(0)
  const [trend, setTrend] = useState<{ date: string; pct: number }[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { start, end } = monthRangeForKey(todayKey())
      const days = daysBetweenKeys(start, end)
      const perf = await statisticsService.monthlyPerformance()
      const overall = statisticsService.overallPct(perf)
      const daily = await statisticsService.dailyTrend(days)
      if (!cancelled) {
        setPct(overall)
        setTrend(daily.map((d) => ({ date: format(new Date(d.date), 'd'), pct: d.pct })))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card span={size ?? 'medium'}>
      <CardTitle>Monthly Progress</CardTitle>
      <SegmentedBar pct={pct} color="bg-growth-500" />
      <div className="mt-3 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={3} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip formatter={(v: number) => [`${v}%`, 'Completed']} />
            <Bar dataKey="pct" fill="#B8792E" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
