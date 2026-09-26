import { useMemo, useRef, useState } from 'react'
import { Plus, ListChecks } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EmptyState } from '@/components/common/EmptyState'
import { HabitForm } from '@/components/habits/HabitForm'
import { HabitListItem } from '@/components/habits/HabitListItem'
import { DeleteHabitDialog } from '@/components/habits/DeleteHabitDialog'
import { useActiveHabits, useArchivedHabits, useCategories } from '@/hooks/useHabits'
import { habitService, type HabitInput } from '@/services/habitService'
import { useToast } from '@/components/common/Toast'
import type { Habit } from '@/types'

type SortMode = 'manual' | 'name' | 'category' | 'trackingType'

export default function HabitsPage() {
  const activeHabits = useActiveHabits()
  const archivedHabits = useArchivedHabits()
  const categories = useCategories()
  const { show } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Habit | undefined>(undefined)
  const [deleting, setDeleting] = useState<Habit | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('manual')
  const [showArchived, setShowArchived] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const [localOrder, setLocalOrder] = useState<Habit[] | null>(null)

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const sorted = useMemo(() => {
    const base = localOrder ?? activeHabits
    if (sortMode === 'manual') return base
    const copy = [...base]
    if (sortMode === 'name') copy.sort((a, b) => a.name.localeCompare(b.name))
    if (sortMode === 'category') copy.sort((a, b) => (categoryById.get(a.categoryId)?.name ?? '').localeCompare(categoryById.get(b.categoryId)?.name ?? ''))
    if (sortMode === 'trackingType') copy.sort((a, b) => a.trackingType.localeCompare(b.trackingType))
    return copy
  }, [localOrder, activeHabits, sortMode, categoryById])

  async function handleCreate(input: HabitInput) {
    await habitService.create(input)
    show(`${input.name} added.`, 'success')
    setShowForm(false)
  }

  async function handleUpdate(input: HabitInput) {
    if (!editing) return
    await habitService.update(editing.id, input)
    show('Changes saved.', 'success')
    setEditing(undefined)
  }

  function handleDragStart(i: number) {
    dragIndex.current = i
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function handleDrop(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    const arr = [...sorted]
    const [moved] = arr.splice(dragIndex.current, 1)
    arr.splice(i, 0, moved)
    dragIndex.current = null
    setLocalOrder(arr)
    habitService.reorder(arr.map((h) => h.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Habits</h1>
          <p className="text-sm text-ink-soft dark:text-paper/60">Manage what you're tracking.</p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
          New habit
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-soft dark:text-paper/60">
          Sort by
          <select
            className="rounded-md border border-black/10 bg-paper-raised px-2 py-1 text-sm dark:border-white/10 dark:bg-dark-surface2"
            value={sortMode}
            onChange={(e) => {
              setLocalOrder(null)
              setSortMode(e.target.value as SortMode)
            }}
          >
            <option value="manual">Manual (drag to reorder)</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="trackingType">Tracking type</option>
          </select>
        </label>
        <button
          className="text-sm font-medium text-growth-600 hover:underline dark:text-growth-300"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Hide archived' : `Archived (${archivedHabits.length})`}
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habits yet"
          message="Create your first habit to start tracking your progress."
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Create a habit
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((habit, i) => (
            <HabitListItem
              key={habit.id}
              habit={habit}
              category={categoryById.get(habit.categoryId)}
              draggable={sortMode === 'manual'}
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onEdit={() => setEditing(habit)}
              onArchive={async () => {
                await habitService.archive(habit.id)
                show(`${habit.name} archived.`, 'success')
              }}
              onDelete={() => setDeleting(habit)}
            />
          ))}
        </div>
      )}

      {showArchived && (
        <div className="space-y-2 border-t border-black/5 pt-4 dark:border-white/5">
          <h2 className="font-display text-sm font-bold text-ink-soft dark:text-paper/60">Archived habits</h2>
          {archivedHabits.length === 0 ? (
            <p className="text-sm text-ink-soft/70 dark:text-paper/40">No archived habits yet.</p>
          ) : (
            archivedHabits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                category={categoryById.get(habit.categoryId)}
                draggable={false}
                archived
                onEdit={() => setEditing(habit)}
                onRestore={async () => {
                  await habitService.restore(habit.id)
                  show(`${habit.name} restored.`, 'success')
                }}
                onDelete={() => setDeleting(habit)}
              />
            ))
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New habit" wide>
        <HabitForm onCancel={() => setShowForm(false)} onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(undefined)} title="Edit habit" wide>
        {editing && <HabitForm initial={editing} onCancel={() => setEditing(undefined)} onSubmit={handleUpdate} />}
      </Modal>

      <DeleteHabitDialog
        habit={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async (keepHistory) => {
          if (!deleting) return
          await habitService.remove(deleting.id, keepHistory)
          show(keepHistory ? `${deleting.name} archived.` : `${deleting.name} deleted.`, 'success')
          setDeleting(null)
        }}
      />
    </div>
  )
}
