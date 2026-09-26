import { useEffect, useState } from 'react'
import { Download, Upload, Trash2, RotateCcw, BellRing, AlertTriangle } from 'lucide-react'
import { Card, CardTitle } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { ImportDialog } from '@/components/settings/ImportDialog'
import { useSettings, updateSettings } from '@/hooks/useSettings'
import { resetDashboardLayout } from '@/hooks/useDashboardLayout'
import { exportService } from '@/services/exportService'
import { notificationService } from '@/services/notificationService'
import { useActiveHabits, useRecordsForDate } from '@/hooks/useHabits'
import { completionStatsForDay, isHabitActiveOn } from '@/utils/calculations'
import { todayKey } from '@/utils/dates'
import { useToast } from '@/components/common/Toast'
import type { AppSettings, ThemeMode } from '@/types'

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow system' },
]

const RETENTION_OPTIONS: { value: AppSettings['reportRetention']; label: string }[] = [
  { value: 'all', label: 'Keep all reports' },
  { value: 'last12', label: 'Last 12 months' },
  { value: 'last6', label: 'Last 6 months' },
  { value: 'last3', label: 'Last 3 months' },
]

export default function SettingsPage() {
  const settings = useSettings()
  const [showImport, setShowImport] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [notifPermission, setNotifPermission] = useState(notificationService.permission())
  const { show } = useToast()
  const habits = useActiveHabits()
  const todayRecords = useRecordsForDate(todayKey())

  useEffect(() => {
    if (settings.reminderEnabled && notifPermission === 'granted') {
      notificationService.scheduleDaily(settings.reminderTime, () => {
        const scheduled = habits.filter((h) => isHabitActiveOn(h, todayKey()))
        const stats = completionStatsForDay(scheduled, todayRecords, todayKey())
        if (stats.total === 0 || stats.pending === 0) return null
        return { title: 'Habit reminder', body: `${stats.pending} habit${stats.pending === 1 ? '' : 's'} left for today.` }
      })
    } else {
      notificationService.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reminderEnabled, settings.reminderTime, notifPermission])

  async function handleEnableReminders(enabled: boolean) {
    if (enabled && notifPermission !== 'granted') {
      const perm = await notificationService.requestPermission()
      setNotifPermission(perm)
      if (perm !== 'granted') {
        show('Notifications are blocked in your browser settings.', 'error')
        return
      }
    }
    await updateSettings({ reminderEnabled: enabled })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Settings</h1>

      <Card span="large">
        <CardTitle>Appearance</CardTitle>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ theme: opt.value })}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                settings.theme === opt.value
                  ? 'border-growth-500 bg-growth-50 text-growth-700 dark:bg-growth-500/10 dark:text-growth-300'
                  : 'border-black/10 text-ink-soft dark:border-white/10 dark:text-paper/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card span="large">
        <CardTitle action={<BellRing className="h-4 w-4 text-ink-soft/50" />}>Notifications</CardTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Daily reminder</p>
            <p className="text-xs text-ink-soft/70 dark:text-paper/50">One general reminder — never per habit.</p>
          </div>
          <Toggle checked={settings.reminderEnabled} onChange={handleEnableReminders} />
        </div>
        {settings.reminderEnabled && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm text-ink-soft dark:text-paper/60">Time</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              className="rounded-md border border-black/10 bg-paper-raised px-2 py-1.5 text-sm dark:border-white/10 dark:bg-dark-surface2"
            />
          </div>
        )}
        {notifPermission === 'denied' && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-brick-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Notifications are blocked for this site in your browser. The reminder will only work while the app is open.
          </p>
        )}
        <p className="mt-2 text-xs text-ink-soft/60 dark:text-paper/40">
          Reminders only fire while this app or tab is open — there's no server to deliver them otherwise.
        </p>
      </Card>

      <Card span="large">
        <CardTitle>Data</CardTitle>
        <div className="space-y-2">
          <Row
            title="Export data"
            description="Download everything as a JSON file you can back up or move to another device."
            action={
              <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => exportService.downloadExport()}>
                Export
              </Button>
            }
          />
          <Row
            title="Import data"
            description="Restore or merge from a previously exported JSON file."
            action={
              <Button variant="secondary" size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => setShowImport(true)}>
                Import
              </Button>
            }
          />
          <Row
            title="Daily data retention"
            description={`Tracking records older than ${settings.retentionMonths} months are automatically removed. Habits themselves are never deleted by this.`}
            action={
              <select
                value={settings.retentionMonths}
                onChange={(e) => updateSettings({ retentionMonths: parseInt(e.target.value, 10) })}
                className="rounded-md border border-black/10 bg-paper-raised px-2 py-1.5 text-sm dark:border-white/10 dark:bg-dark-surface2"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={0}>Never</option>
              </select>
            }
          />
          <Row
            title="Clear all data"
            description="Permanently deletes every habit, record, and setting from this device."
            action={
              <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmClear(true)}>
                Clear
              </Button>
            }
          />
        </div>
      </Card>

      <Card span="large">
        <CardTitle>Reports</CardTitle>
        <Row
          title="Report retention"
          description="How many months of monthly reports to keep."
          action={
            <select
              value={settings.reportRetention}
              onChange={(e) => updateSettings({ reportRetention: e.target.value as AppSettings['reportRetention'] })}
              className="rounded-md border border-black/10 bg-paper-raised px-2 py-1.5 text-sm dark:border-white/10 dark:bg-dark-surface2"
            >
              {RETENTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          }
        />
      </Card>

      <Card span="large">
        <CardTitle>Dashboard</CardTitle>
        <Row
          title="Reset dashboard layout"
          description="Restores widget visibility, order, and sizes to the default."
          action={
            <Button variant="secondary" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => resetDashboardLayout()}>
              Reset
            </Button>
          }
        />
      </Card>

      <Card span="large">
        <CardTitle>About</CardTitle>
        <div className="space-y-2 text-sm text-ink-soft dark:text-paper/60">
          <p>Habit Tracker · v1.0.0</p>
          <p>Built with React, TypeScript, Vite, Tailwind CSS, and IndexedDB (via Dexie).</p>
          <p className="rounded-md bg-paper-sunken p-3 text-ink dark:bg-dark-surface2 dark:text-paper">
            Your habit data is stored locally on this device. This application does not require an account or upload your habit
            data to a server.
          </p>
        </div>
      </Card>

      <ImportDialog open={showImport} onClose={() => setShowImport(false)} onImported={() => show('Data imported.', 'success')} />

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all data?">
        <p className="mb-4 text-sm text-ink-soft dark:text-paper/60">
          This permanently deletes every habit, tracking record, note, and setting on this device. This can't be undone — consider
          exporting a backup first.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              await exportService.clearAllData()
              setConfirmClear(false)
              show('All data cleared.', 'success')
            }}
          >
            Delete everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Row({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/5 py-3 last:border-0 dark:border-white/5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink dark:text-paper">{title}</p>
        <p className="text-xs text-ink-soft/70 dark:text-paper/50">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-growth-500' : 'bg-black/15 dark:bg-white/15'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}
