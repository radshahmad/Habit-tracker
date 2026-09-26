import type { ExportPayload, TrackingType } from '@/types'

export interface FieldErrors {
  [field: string]: string
}

export interface HabitFormInput {
  name: string
  trackingType: TrackingType
  target?: number | string
  unit?: string
  startDate: string
  endDate?: string
}

export function validateHabitForm(input: HabitFormInput): FieldErrors {
  const errors: FieldErrors = {}

  if (!input.name || !input.name.trim()) {
    errors.name = 'Give this habit a name.'
  } else if (input.name.trim().length > 60) {
    errors.name = 'Keep the name under 60 characters.'
  }

  if (input.trackingType !== 'simple') {
    const target = typeof input.target === 'string' ? parseFloat(input.target) : input.target
    if (target == null || Number.isNaN(target) || target <= 0) {
      errors.target = 'Set a target greater than 0.'
    }
    if (!input.unit || !input.unit.trim()) {
      errors.unit = 'Add a unit, like "pages" or "minutes".'
    }
  }

  if (!input.startDate) {
    errors.startDate = 'Pick a start date.'
  }

  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    errors.endDate = 'End date must be after the start date.'
  }

  return errors
}

export function validateMeasurableValue(value: number | undefined): string | null {
  if (value == null || Number.isNaN(value)) return 'Enter a number.'
  if (value < 0) return "Can't be negative."
  if (value > 1_000_000) return 'That number looks too large.'
  return null
}

/** Structural validation for an imported JSON export. Never executes the file's contents. */
export function validateImportPayload(data: unknown): { ok: true; payload: ExportPayload } | { ok: false; error: string } {
  if (typeof data !== 'object' || data === null) {
    return { ok: false, error: 'File is not a valid JSON object.' }
  }
  const obj = data as Record<string, unknown>

  if (obj.version !== 1) {
    return { ok: false, error: `Unsupported export version: ${String(obj.version)}. This app supports version 1.` }
  }

  const arrayFields = ['habits', 'habitVersions', 'categories', 'records', 'dailyNotes', 'monthlyReports'] as const
  for (const field of arrayFields) {
    if (!Array.isArray(obj[field])) {
      return { ok: false, error: `Missing or invalid "${field}" list in the file.` }
    }
  }

  if (typeof obj.settings !== 'object' || obj.settings === null) {
    return { ok: false, error: 'Missing "settings" in the file.' }
  }
  if (typeof obj.dashboard !== 'object' || obj.dashboard === null) {
    return { ok: false, error: 'Missing "dashboard" in the file.' }
  }

  const habits = obj.habits as unknown[]
  for (const h of habits) {
    if (typeof h !== 'object' || h === null) return { ok: false, error: 'One of the habits is malformed.' }
    const habit = h as Record<string, unknown>
    if (typeof habit.id !== 'string' || typeof habit.name !== 'string') {
      return { ok: false, error: 'A habit is missing its id or name.' }
    }
  }

  const records = obj.records as unknown[]
  for (const r of records) {
    if (typeof r !== 'object' || r === null) return { ok: false, error: 'One of the tracking records is malformed.' }
    const rec = r as Record<string, unknown>
    if (typeof rec.habitId !== 'string' || typeof rec.date !== 'string') {
      return { ok: false, error: 'A tracking record is missing its habit or date.' }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) {
      return { ok: false, error: `Invalid date format in a record: "${rec.date}".` }
    }
  }

  return { ok: true, payload: obj as unknown as ExportPayload }
}
