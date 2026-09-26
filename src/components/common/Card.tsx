import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  span,
}: {
  children: ReactNode
  className?: string
  span?: 'small' | 'medium' | 'large'
}) {
  const spanClass =
    span === 'large' ? 'md:col-span-2 lg:col-span-3' : span === 'medium' ? 'md:col-span-2 lg:col-span-2' : 'lg:col-span-1'
  return (
    <div
      className={`rounded-lg border border-black/5 bg-paper-raised p-5 shadow-card dark:border-white/5 dark:bg-dark-surface ${spanClass} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="font-display text-sm font-bold text-ink dark:text-paper">{children}</h3>
      {action}
    </div>
  )
}
