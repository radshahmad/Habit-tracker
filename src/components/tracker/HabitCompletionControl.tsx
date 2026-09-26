import { useState } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'
import type { DailyRecord, Habit } from '@/types'

interface Props {
  habit: Habit
  record?: DailyRecord
  locked: boolean
  lockedReason?: string
  compact?: boolean
  onSetSimple: (status: 'completed' | 'missed' | 'clear') => void
  onSetValue: (value: number) => void
}

/** Renders whichever control fits the habit's tracking type — never one generic input for all four. */
export function HabitCompletionControl({ habit, record, locked, lockedReason, compact, onSetSimple, onSetValue }: Props) {
  if (habit.trackingType === 'simple') {
    return <SimpleControl status={record?.status} locked={locked} lockedReason={lockedReason} compact={compact} onSet={onSetSimple} />
  }
  return (
    <MeasurableControl
      habit={habit}
      value={record?.actualValue ?? 0}
      status={record?.status}
      locked={locked}
      lockedReason={lockedReason}
      compact={compact}
      onChange={onSetValue}
      onMarkMissed={() => onSetSimple('missed')}
    />
  )
}

function SimpleControl({
  status,
  locked,
  lockedReason,
  compact,
  onSet,
}: {
  status?: DailyRecord['status']
  locked: boolean
  lockedReason?: string
  compact?: boolean
  onSet: (status: 'completed' | 'missed' | 'clear') => void
}) {
  const size = compact ? 'h-8 w-8' : 'h-11 w-11'
  return (
    <div className="flex items-center gap-1.5" title={locked ? lockedReason : undefined}>
      <button
        type="button"
        disabled={locked}
        aria-label="Mark completed"
        aria-pressed={status === 'completed'}
        onClick={() => onSet(status === 'completed' ? 'clear' : 'completed')}
        className={`flex ${size} items-center justify-center rounded-md border-2 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          status === 'completed'
            ? 'border-growth-500 bg-growth-500 text-white animate-[pop_180ms_ease-out]'
            : 'border-black/15 text-transparent hover:border-growth-400 dark:border-white/15'
        }`}
      >
        <Check className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>
      {!compact && (
        <button
          type="button"
          disabled={locked}
          aria-label="Mark missed"
          aria-pressed={status === 'missed'}
          onClick={() => onSet(status === 'missed' ? 'clear' : 'missed')}
          className={`flex ${size} items-center justify-center rounded-md border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            status === 'missed' ? 'border-brick-500 bg-brick-500 text-white' : 'border-black/15 text-transparent hover:border-brick-400 dark:border-white/15'
          }`}
        >
          <X className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </button>
      )}
    </div>
  )
}

function MeasurableControl({
  habit,
  value,
  status,
  locked,
  lockedReason,
  compact,
  onChange,
  onMarkMissed,
}: {
  habit: Habit
  value: number
  status?: DailyRecord['status']
  locked: boolean
  lockedReason?: string
  compact?: boolean
  onChange: (v: number) => void
  onMarkMissed: () => void
}) {
  const [draft, setDraft] = useState<string>(String(value || ''))
  const target = habit.target ?? 0
  const step = habit.trackingType === 'duration' ? 5 : 1
  const achieved = status === 'completed'

  function commit(next: number) {
    const clamped = Math.max(0, next)
    setDraft(String(clamped))
    onChange(clamped)
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5" title={locked ? lockedReason : undefined}>
        <input
          type="number"
          disabled={locked}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(parseFloat(draft) || 0)}
          className={`w-14 rounded-md border px-1.5 py-1 text-center text-xs tabular-nums outline-none disabled:opacity-40 ${
            achieved ? 'border-growth-500 bg-growth-50 dark:bg-growth-500/10' : 'border-black/10 dark:border-white/10 dark:bg-dark-surface2'
          }`}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2" title={locked ? lockedReason : undefined}>
      <button
        type="button"
        disabled={locked}
        aria-label={`Decrease by ${step}`}
        onClick={() => commit((parseFloat(draft) || 0) - step)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 disabled:opacity-40 dark:border-white/10"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        disabled={locked}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(parseFloat(draft) || 0)}
        className={`w-16 rounded-md border px-2 py-1.5 text-center text-sm font-semibold tabular-nums outline-none disabled:opacity-40 ${
          achieved ? 'border-growth-500 bg-growth-50 dark:bg-growth-500/10' : 'border-black/10 dark:border-white/10 dark:bg-dark-surface2'
        }`}
      />
      <button
        type="button"
        disabled={locked}
        aria-label={`Increase by ${step}`}
        onClick={() => commit((parseFloat(draft) || 0) + step)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-black/10 disabled:opacity-40 dark:border-white/10"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="text-xs text-ink-soft/70 dark:text-paper/50">/ {target} {habit.unit}</span>
      {!achieved && (
        <button type="button" disabled={locked} onClick={onMarkMissed} className="text-xs text-brick-500 hover:underline disabled:opacity-40">
          Mark missed
        </button>
      )}
    </div>
  )
}
