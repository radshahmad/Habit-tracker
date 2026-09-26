import type { ReactNode } from 'react'

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink dark:text-paper">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft dark:text-paper/50">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-brick-500">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-md border border-black/10 bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-growth-500 dark:border-white/10 dark:bg-dark-surface2 dark:text-paper'
