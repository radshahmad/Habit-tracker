import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeeded } from '@/db/database'
import { DEFAULT_WIDGETS } from '@/db/defaultDashboard'
import type { DashboardLayout, DashboardWidgetConfig } from '@/types'

export function useDashboardLayout(): DashboardLayout {
  const layout = useLiveQuery(async () => {
    await ensureSeeded()
    return db.dashboard.get('dashboard')
  }, [])
  return layout ?? { id: 'dashboard', widgets: DEFAULT_WIDGETS, updatedAt: new Date().toISOString() }
}

export async function saveDashboardLayout(widgets: DashboardWidgetConfig[]): Promise<void> {
  await db.dashboard.put({ id: 'dashboard', widgets, updatedAt: new Date().toISOString() })
}

export async function resetDashboardLayout(): Promise<void> {
  await saveDashboardLayout(DEFAULT_WIDGETS.map((w) => ({ ...w })))
}
