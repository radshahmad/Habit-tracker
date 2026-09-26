import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { Card, CardTitle } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useActiveHabits } from '@/hooks/useHabits'
import { statisticsService, type HabitPerformance } from '@/services/statisticsService'
import { daysBetweenKeys, subDaysFromKey, todayKey } from '@/utils/dates'
import { BarChart3 } from 'lucide-react'

type RangeOption = '7' | '30' | '90'

export default function StatisticsPage() {
  const habits = useActiveHabits()
  const [habitId, setHabitId] = useState<string>('all')
  const [range, setRange] = useState<RangeOption>('30')
  const [trend, setTrend] = useState<{ date: string; pct: number }[]>([])
  const [performances, setPerformances] = useState<HabitPerformance[]>([])

  const dateKeys = useMemo(() => {
    const days = parseInt(range, 10)
    return daysBetweenKeys(subDaysFromKey(todayKey(), days - 1), todayKey())
  }, [range])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const daily = await statisticsService.dailyTrend(dateKeys)
      const perf = await statisticsService.performanceForRange(dateKeys)
      if (!cancelled) {
        setTrend(daily.map((d) => ({ date: format(new Date(d.date), 'MMM d'), pct: d.pct })))
        setPerformances(perf)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [dateKeys])

  const filteredPerformances = habitId === 'all' ? performances : performances.filter((p) => p.habit.id === habitId)
  const comparisonData = performances.map((p) => ({ name: p.habit.name, pct: p.stats.pct }))

  if (habits.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Statistics</h1>
        <EmptyState icon={BarChart3} title="No statistics yet" message="Complete a few habits to start seeing your trends." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Statistics</h1>
        <div className="flex gap-2">
          <select
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            className="rounded-md border border-black/10 bg-paper-raised px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-dark-surface2"
          >
            <option value="all">All habits</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeOption)}
            className="rounded-md border border-black/10 bg-paper-raised px-2.5 py-1.5 text-sm dark:border-white/10 dark:bg-dark-surface2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <Card span="large">
        <CardTitle>Completion Trend</CardTitle>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-black/5 dark:stroke-white/10" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Completion']} />
              <Line type="monotone" dataKey="pct" stroke="#2F6F62" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card span="large">
        <CardTitle>Habit Comparison</CardTitle>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-black/5 dark:stroke-white/10" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Completion']} />
              <Bar dataKey="pct" fill="#B8792E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card span="large">
        <CardTitle>Habit Details</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs text-ink-soft/70 dark:border-white/5 dark:text-paper/40">
                <th className="py-2 pr-3 font-medium">Habit</th>
                <th className="py-2 pr-3 font-medium">Completion</th>
                <th className="py-2 pr-3 font-medium">Completed</th>
                <th className="py-2 pr-3 font-medium">Missed</th>
                <th className="py-2 pr-3 font-medium">Current streak</th>
                <th className="py-2 font-medium">Longest streak</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformances.map((p) => (
                <tr key={p.habit.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="py-2 pr-3">{p.habit.icon} {p.habit.name}</td>
                  <td className="py-2 pr-3 font-semibold">{p.stats.pct}%</td>
                  <td className="py-2 pr-3">{p.stats.completed}</td>
                  <td className="py-2 pr-3">{p.stats.missed}</td>
                  <td className="py-2 pr-3">{p.currentStreak}</td>
                  <td className="py-2">{p.longestStreak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
