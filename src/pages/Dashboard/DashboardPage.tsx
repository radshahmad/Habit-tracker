import { useRef, useState } from 'react'
import { Settings2, RotateCcw, EyeOff, Eye, Maximize2, GripVertical } from 'lucide-react'
import { WIDGET_REGISTRY } from '@/components/dashboard/registry'
import { Button } from '@/components/common/Button'
import { useDashboardLayout, saveDashboardLayout, resetDashboardLayout } from '@/hooks/useDashboardLayout'
import type { DashboardWidgetConfig } from '@/types'

const SIZE_CYCLE: DashboardWidgetConfig['size'][] = ['small', 'medium', 'large']

export default function DashboardPage() {
  const layout = useDashboardLayout()
  const [editing, setEditing] = useState(false)
  const dragIndex = useRef<number | null>(null)

  const sortedAll = [...layout.widgets].sort((a, b) => a.order - b.order)
  const visible = sortedAll.filter((w) => w.visible)
  const hidden = sortedAll.filter((w) => !w.visible)

  function persist(next: DashboardWidgetConfig[]) {
    saveDashboardLayout(next.map((w, i) => ({ ...w, order: i })))
  }

  function toggleVisible(id: string) {
    persist(sortedAll.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)))
  }

  function cycleSize(id: string) {
    persist(
      sortedAll.map((w) => {
        if (w.id !== id) return w
        const idx = SIZE_CYCLE.indexOf(w.size)
        return { ...w, size: SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length] }
      }),
    )
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex.current === null || dragIndex.current === targetIndex) return
    const arr = [...visible]
    const [moved] = arr.splice(dragIndex.current, 1)
    arr.splice(targetIndex, 0, moved)
    dragIndex.current = null
    // Merge back with hidden widgets, preserving their relative order at the end.
    persist([...arr, ...hidden])
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink dark:text-paper">Dashboard</h1>
          <p className="text-sm text-ink-soft dark:text-paper/60">Your self-improvement overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => resetDashboardLayout()}>
            Reset
          </Button>
          <Button
            variant={editing ? 'primary' : 'secondary'}
            size="sm"
            icon={<Settings2 className="h-4 w-4" />}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {editing && hidden.length > 0 && (
        <div className="rounded-md border border-dashed border-black/15 p-3 dark:border-white/15">
          <p className="mb-2 text-xs font-medium text-ink-soft dark:text-paper/60">Hidden widgets</p>
          <div className="flex flex-wrap gap-2">
            {hidden.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleVisible(w.id)}
                className="flex items-center gap-1.5 rounded-md border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-black/5 dark:border-white/10 dark:text-paper/60 dark:hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" /> {WIDGET_REGISTRY[w.id].title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((w, i) => {
          const { title, component: WidgetComponent } = WIDGET_REGISTRY[w.id]
          return (
            <div
              key={w.id}
              draggable={editing}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => editing && e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className={`relative ${w.size === 'large' ? 'md:col-span-2 lg:col-span-3' : w.size === 'medium' ? 'md:col-span-2 lg:col-span-2' : ''}`}
            >
              {editing && (
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-black/10 bg-paper-raised/95 px-1.5 py-1 shadow-card backdrop-blur dark:border-white/10 dark:bg-dark-surface/95">
                  <span className="cursor-grab px-0.5 text-ink-soft/50" title="Drag to reorder">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <button onClick={() => cycleSize(w.id)} title={`Size: ${w.size} (click to change)`} className="rounded p-1 text-ink-soft/70 hover:bg-black/5 dark:hover:bg-white/10">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => toggleVisible(w.id)} title="Hide widget" className="rounded p-1 text-ink-soft/70 hover:bg-black/5 dark:hover:bg-white/10">
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <WidgetComponent size={w.size} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
