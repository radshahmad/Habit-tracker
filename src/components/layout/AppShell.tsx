import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useAppliedTheme } from '@/hooks/useTheme'
import { useSettings } from '@/hooks/useSettings'
import { exportService } from '@/services/exportService'
import { reportService } from '@/services/reportService'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

export function AppShell() {
  useAppliedTheme() // applies theme class to <html>; render value not needed here
  const settings = useSettings()

  useEffect(() => {
    // Runs once per app load: prunes old daily records per the retention
    // setting, and trims monthly report snapshots per the report-retention
    // setting. Never touches habits themselves.
    exportService.applyDataRetention()
    reportService.applyRetention()
  }, [])

  return (
    <div className="flex min-h-screen bg-paper dark:bg-dark-bg">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
      <OnboardingModal open={!settings.onboardingComplete} onDone={() => {}} />
    </div>
  )
}
