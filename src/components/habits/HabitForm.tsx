import { useState } from 'react'
import type { Habit, TrackingType } from '@/types'
import { Field, inputClass } from '@/components/common/Field'
import { Button } from '@/components/common/Button'
import { useCategories } from '@/hooks/useHabits'
import { validateHabitForm, type FieldErrors } from '@/utils/validation'
import { todayKey } from '@/utils/dates'
import type { HabitInput } from '@/services/habitService'

const TRACKING_TYPES: { value: TrackingType; label: string; hint: string }[] = [
  { value: 'simple', label: 'Simple', hint: 'Done or not — e.g. "Meditate"' },
  { value: 'count', label: 'Count', hint: 'e.g. 20 push-ups' },
  { value: 'duration', label: 'Duration', hint: 'e.g. 30 minutes' },
  { value: 'quantity', label: 'Quantity', hint: 'e.g. 2 liters of water' },
]

const ICON_PRESETS = ['💧', '📖', '🏋️', '🧘', '🛌', '💊', '🚶', '✍️', '🎯', '🌱', '🎸', '💻']
const COLOR_PRESETS = ['#2F6F62', '#B8792E', '#4F6D8C', '#6B5B95', '#A8503D', '#5C8A4A', '#8A6FA8', '#5B6B8C']

export function HabitForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Habit
  onCancel: () => void
  onSubmit: (input: HabitInput) => Promise<void>
}) {
  const categories = useCategories()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? ICON_PRESETS[0])
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0])
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [trackingType, setTrackingType] = useState<TrackingType>(initial?.trackingType ?? 'simple')
  const [target, setTarget] = useState<string>(initial?.target != null ? String(initial.target) : '')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayKey())
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const effectiveCategoryId = categoryId || categories[0]?.id || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validateHabitForm({ name, trackingType, target, unit, startDate, endDate: endDate || undefined })
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({
        name,
        description: description || undefined,
        icon,
        color,
        categoryId: effectiveCategoryId,
        trackingType,
        target: trackingType === 'simple' ? undefined : parseFloat(target),
        unit: trackingType === 'simple' ? undefined : unit,
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Habit name" error={errors.name}>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drink water" maxLength={60} autoFocus />
      </Field>

      <Field label="Description (optional)">
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short reminder of why this matters" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {ICON_PRESETS.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setIcon(opt)}
                aria-label={`Use icon ${opt}`}
                className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg ${
                  icon === opt ? 'border-growth-500 bg-growth-50 dark:bg-growth-500/10' : 'border-black/10 dark:border-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => setColor(opt)}
                aria-label={`Use color ${opt}`}
                className={`h-9 w-9 rounded-md border-2 ${color === opt ? 'border-ink dark:border-paper' : 'border-transparent'}`}
                style={{ backgroundColor: opt }}
              />
            ))}
          </div>
        </Field>
      </div>

      <Field label="Category">
        <select className={inputClass} value={effectiveCategoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tracking type">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRACKING_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setTrackingType(t.value)}
              className={`rounded-md border px-2.5 py-2 text-left text-xs ${
                trackingType === t.value
                  ? 'border-growth-500 bg-growth-50 dark:bg-growth-500/10'
                  : 'border-black/10 dark:border-white/10'
              }`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="text-ink-soft/70 dark:text-paper/50">{t.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      {trackingType !== 'simple' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Target" error={errors.target}>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={trackingType === 'duration' ? '30' : '20'}
            />
          </Field>
          <Field label="Unit" error={errors.unit}>
            <input
              className={inputClass}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={trackingType === 'duration' ? 'minutes' : trackingType === 'count' ? 'reps' : 'pages'}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" error={errors.startDate}>
          <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date (optional)" error={errors.endDate}>
          <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {initial ? 'Save changes' : 'Create habit'}
        </Button>
      </div>
    </form>
  )
}
