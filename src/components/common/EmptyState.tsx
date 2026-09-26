import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-black/10 px-6 py-14 text-center dark:border-white/10">
      <Icon className="mb-3 h-9 w-9 text-ink-soft/50 dark:text-paper/40" strokeWidth={1.5} aria-hidden="true" />
      <p className="font-display text-base font-bold text-ink dark:text-paper">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-soft dark:text-paper/60">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
