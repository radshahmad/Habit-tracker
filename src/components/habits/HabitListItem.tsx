import { GripVertical, Pencil, Archive, Trash2, ArchiveRestore } from 'lucide-react'
import type { Category, Habit } from '@/types'
import { Button } from '@/components/common/Button'

export function HabitListItem({
  habit,
  category,
  draggable,
  archived,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  habit: Habit
  category?: Category
  draggable: boolean
  archived?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  onEdit: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDelete: () => void
}) {
  const trackingLabel =
    habit.trackingType === 'simple'
      ? 'Simple'
      : `${habit.trackingType[0].toUpperCase()}${habit.trackingType.slice(1)} · target ${habit.target ?? '—'} ${habit.unit ?? ''}`

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-3 rounded-md border border-black/5 bg-paper-raised px-3 py-3 dark:border-white/5 dark:bg-dark-surface"
    >
      {draggable && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-soft/40 dark:text-paper/30" aria-hidden="true" />}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base"
        style={{ backgroundColor: `${habit.color}22` }}
        aria-hidden="true"
      >
        {habit.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink dark:text-paper">{habit.name}</p>
        <p className="truncate text-xs text-ink-soft/70 dark:text-paper/50">
          {category ? `${category.icon} ${category.name}` : 'Uncategorized'} · {trackingLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${habit.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
        {archived ? (
          <Button variant="ghost" size="sm" onClick={onRestore} aria-label={`Restore ${habit.name}`}>
            <ArchiveRestore className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onArchive} aria-label={`Archive ${habit.name}`}>
            <Archive className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${habit.name}`}>
          <Trash2 className="h-4 w-4 text-brick-500" />
        </Button>
      </div>
    </div>
  )
}
