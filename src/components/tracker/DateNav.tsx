import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { addDaysToKey, formatFriendly, isTodayKey, subDaysFromKey, todayKey } from '@/utils/dates'

export function DateNav({ date, onChange }: { date: string; onChange: (next: string) => void }) {
  const isToday = isTodayKey(date)

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-black/5 bg-paper-raised px-3 py-2 dark:border-white/5 dark:bg-dark-surface">
      <button
        aria-label="Previous day"
        onClick={() => onChange(subDaysFromKey(date, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-black/5 dark:text-paper/60 dark:hover:bg-white/10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-center gap-2">
        <span className="font-display text-sm font-bold text-ink dark:text-paper">{formatFriendly(date)}</span>
        {!isToday && (
          <button onClick={() => onChange(todayKey())} className="text-xs font-medium text-growth-600 hover:underline dark:text-growth-300">
            Jump to today
          </button>
        )}
      </div>

      <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-ink-soft hover:bg-black/5 dark:text-paper/60 dark:hover:bg-white/10">
        <CalendarDays className="h-5 w-5" />
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick a date"
        />
      </label>

      <button
        aria-label="Next day"
        onClick={() => onChange(addDaysToKey(date, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-black/5 dark:text-paper/60 dark:hover:bg-white/10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
