import { describe, it, expect } from 'vitest'
import { validateHabitForm, validateImportPayload } from '../validation'

describe('validateHabitForm', () => {
  it('requires a name', () => {
    const errors = validateHabitForm({ name: '', trackingType: 'simple', startDate: '2026-01-01' })
    expect(errors.name).toBeTruthy()
  })

  it('requires target and unit for measurable types', () => {
    const errors = validateHabitForm({ name: 'Read', trackingType: 'quantity', startDate: '2026-01-01' })
    expect(errors.target).toBeTruthy()
    expect(errors.unit).toBeTruthy()
  })

  it('passes for a valid simple habit', () => {
    const errors = validateHabitForm({ name: 'Meditate', trackingType: 'simple', startDate: '2026-01-01' })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('rejects an end date before the start date', () => {
    const errors = validateHabitForm({
      name: 'Read',
      trackingType: 'simple',
      startDate: '2026-01-10',
      endDate: '2026-01-01',
    })
    expect(errors.endDate).toBeTruthy()
  })
})

describe('validateImportPayload', () => {
  it('rejects non-object input', () => {
    const result = validateImportPayload('not an object')
    expect(result.ok).toBe(false)
  })

  it('rejects an unsupported version', () => {
    const result = validateImportPayload({ version: 2 })
    expect(result.ok).toBe(false)
  })

  it('rejects malformed records', () => {
    const result = validateImportPayload({
      version: 1,
      habits: [],
      habitVersions: [],
      categories: [],
      records: [{ habitId: 'h1', date: 'not-a-date' }],
      dailyNotes: [],
      monthlyReports: [],
      settings: {},
      dashboard: {},
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a well-formed minimal payload', () => {
    const result = validateImportPayload({
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: [{ id: 'h1', name: 'Test' }],
      habitVersions: [],
      categories: [],
      records: [{ habitId: 'h1', date: '2026-01-01' }],
      dailyNotes: [],
      monthlyReports: [],
      settings: {},
      dashboard: {},
    })
    expect(result.ok).toBe(true)
  })
})
