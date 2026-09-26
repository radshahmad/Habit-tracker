import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import TodayPage from '@/pages/Today/TodayPage'
import TrackerPage from '@/pages/Tracker/TrackerPage'
import StatisticsPage from '@/pages/Statistics/StatisticsPage'
import ReportsPage from '@/pages/Reports/ReportsPage'
import HabitsPage from '@/pages/Habits/HabitsPage'
import SettingsPage from '@/pages/Settings/SettingsPage'

// Vite's BASE_URL (set via vite.config.ts's `base`) keeps routing correct
// under a GitHub Pages sub-path, e.g. /habit-tracker/.
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
