import { useEffect, useRef, useState } from 'react'
import { habitService } from '@/services/habitService'
import { useDailyNote } from '@/hooks/useHabits'

export function DailyNoteEditor({ date, compact }: { date: string; compact?: boolean }) {
  const note = useDailyNote(date)
  const [value, setValue] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedDate = useRef<string | null>(null)

  useEffect(() => {
    // Only sync from the DB when the date changes (or first load) so we
    // don't stomp on what the person is actively typing.
    if (loadedDate.current !== date) {
      setValue(note?.content ?? '')
      loadedDate.current = date
    }
  }, [date, note?.content])

  function handleChange(next: string) {
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      await habitService.setNote(date, next)
      setSavedAt(Date.now())
    }, 500)
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="How did today go? Anything worth remembering…"
        rows={compact ? 3 : 4}
        className="w-full resize-none rounded-md border border-black/10 bg-paper-raised px-3 py-2 text-sm outline-none focus:border-growth-500 dark:border-white/10 dark:bg-dark-surface2"
      />
      {savedAt && <p className="mt-1 text-right text-[11px] text-ink-soft/50 dark:text-paper/30">Saved</p>}
    </div>
  )
}
