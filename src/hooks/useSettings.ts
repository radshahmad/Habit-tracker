import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureSeeded } from '@/db/database'
import type { AppSettings } from '@/types'

const FALLBACK: AppSettings = {
  id: 'settings',
  theme: 'system',
  reminderEnabled: false,
  reminderTime: '21:00',
  retentionMonths: 6,
  reportRetention: 'last12',
  onboardingComplete: false,
}

export function useSettings(): AppSettings {
  const settings = useLiveQuery(async () => {
    await ensureSeeded()
    return db.settings.get('settings')
  }, [])
  return settings ?? FALLBACK
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await ensureSeeded()
  const current = (await db.settings.get('settings')) ?? FALLBACK
  await db.settings.put({ ...current, ...patch })
}
