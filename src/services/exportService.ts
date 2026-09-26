import { db, ensureSeeded } from '@/db/database'
import type { ExportPayload } from '@/types'
import { validateImportPayload } from '@/utils/validation'

export type ImportStrategy = 'replace' | 'merge'

export const exportService = {
  async buildExport(): Promise<ExportPayload> {
    await ensureSeeded()
    const [habits, habitVersions, categories, records, dailyNotes, settings, dashboard, monthlyReports] =
      await Promise.all([
        db.habits.toArray(),
        db.habitVersions.toArray(),
        db.categories.toArray(),
        db.records.toArray(),
        db.dailyNotes.toArray(),
        db.settings.get('settings'),
        db.dashboard.get('dashboard'),
        db.monthlyReports.toArray(),
      ])

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      habitVersions,
      categories,
      records,
      dailyNotes,
      settings: settings!,
      dashboard: dashboard!,
      monthlyReports,
    }
  },

  async downloadExport(): Promise<void> {
    const payload = await this.buildExport()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `habit-tracker-export-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  /** Parses and structurally validates a file without importing it yet. */
  async previewImport(file: File): Promise<{ ok: true; payload: ExportPayload; summary: string } | { ok: false; error: string }> {
    let raw: unknown
    try {
      const text = await file.text()
      raw = JSON.parse(text)
    } catch {
      return { ok: false, error: 'This file is not valid JSON.' }
    }
    const result = validateImportPayload(raw)
    if (!result.ok) return result
    const p = result.payload
    const summary = `${p.habits.length} habits, ${p.records.length} tracking records, ${p.dailyNotes.length} daily notes, exported ${new Date(p.exportedAt).toLocaleString()}.`
    return { ok: true, payload: p, summary }
  },

  /**
   * Imports a previously-validated payload. "replace" wipes existing local
   * data first; "merge" adds/overwrites by id and keeps anything not present
   * in the file. Never executes any code from the file — only reads plain
   * data fields into the database.
   */
  async importPayload(payload: ExportPayload, strategy: ImportStrategy): Promise<void> {
    await db.transaction(
      'rw',
      [db.habits, db.habitVersions, db.categories, db.records, db.dailyNotes, db.settings, db.dashboard, db.monthlyReports],
      async () => {
        if (strategy === 'replace') {
          await Promise.all([
            db.habits.clear(),
            db.habitVersions.clear(),
            db.categories.clear(),
            db.records.clear(),
            db.dailyNotes.clear(),
            db.monthlyReports.clear(),
          ])
        }
        await db.habits.bulkPut(payload.habits)
        await db.habitVersions.bulkPut(payload.habitVersions)
        await db.categories.bulkPut(payload.categories)
        await db.records.bulkPut(payload.records)
        await db.dailyNotes.bulkPut(payload.dailyNotes)
        await db.monthlyReports.bulkPut(payload.monthlyReports)
        if (payload.settings) await db.settings.put(payload.settings)
        if (payload.dashboard) await db.dashboard.put(payload.dashboard)
      },
    )
  },

  /** Deletes daily records older than the retention window, never touching habits themselves. */
  async applyDataRetention(): Promise<number> {
    const settings = await db.settings.get('settings')
    const months = settings?.retentionMonths ?? 6
    if (!months || months <= 0) return 0 // 0 = "Never" — retention disabled
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)
    const cutoffKey = cutoff.toISOString().slice(0, 10)
    const old = await db.records.where('date').below(cutoffKey).toArray()
    if (old.length > 0) {
      await db.records.bulkDelete(old.map((r) => r.id))
    }
    return old.length
  },

  async clearAllData(): Promise<void> {
    await db.transaction(
      'rw',
      [db.habits, db.habitVersions, db.categories, db.records, db.dailyNotes, db.settings, db.dashboard, db.monthlyReports],
      async () => {
        await Promise.all([
          db.habits.clear(),
          db.habitVersions.clear(),
          db.categories.clear(),
          db.records.clear(),
          db.dailyNotes.clear(),
          db.settings.clear(),
          db.dashboard.clear(),
          db.monthlyReports.clear(),
        ])
      },
    )
    await ensureSeeded()
  },
}
