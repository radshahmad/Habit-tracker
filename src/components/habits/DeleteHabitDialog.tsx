import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import type { Habit } from '@/types'

export function DeleteHabitDialog({
  habit,
  onCancel,
  onConfirm,
}: {
  habit: Habit | null
  onCancel: () => void
  onConfirm: (keepHistory: boolean) => Promise<void>
}) {
  const [keepHistory, setKeepHistory] = useState(true)
  const [working, setWorking] = useState(false)

  if (!habit) return null

  return (
    <Modal open={!!habit} onClose={onCancel} title={`Delete "${habit.name}"?`}>
      <p className="mb-4 text-sm text-ink-soft dark:text-paper/60">
        Choose what happens to this habit's streak and tracking history.
      </p>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-black/10 p-3 dark:border-white/10">
          <input type="radio" checked={keepHistory} onChange={() => setKeepHistory(true)} className="mt-0.5" />
          <span>
            <span className="block text-sm font-medium">Keep history</span>
            <span className="block text-xs text-ink-soft/70 dark:text-paper/50">
              Removes it from your active list but keeps past records for statistics and reports (same as archiving).
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-black/10 p-3 dark:border-white/10">
          <input type="radio" checked={!keepHistory} onChange={() => setKeepHistory(false)} className="mt-0.5" />
          <span>
            <span className="block text-sm font-medium">Delete everything</span>
            <span className="block text-xs text-ink-soft/70 dark:text-paper/50">
              Permanently removes the habit and all of its tracking history. This can't be undone.
            </span>
          </span>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={working}
          onClick={async () => {
            setWorking(true)
            try {
              await onConfirm(keepHistory)
            } finally {
              setWorking(false)
            }
          }}
        >
          {keepHistory ? 'Remove from active list' : 'Delete permanently'}
        </Button>
      </div>
    </Modal>
  )
}
