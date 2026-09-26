interface SegmentedBarProps {
  pct: number // 0-100
  segments?: number
  color?: string // tailwind color class for filled segments, e.g. "bg-growth-500"
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showPct?: boolean
}

/**
 * The app's signature progress indicator: a row of discrete blocks rather
 * than a smooth bar — a direct, modernized nod to the original spreadsheet
 * tracker's "██████████████░░░░ 75%" style, reused everywhere progress is
 * shown (Dashboard, Today, Reports) so it reads as this product's own device
 * rather than a generic progress bar.
 */
export function SegmentedBar({ pct, segments = 20, color = 'bg-growth-500', size = 'md', label, showPct = true }: SegmentedBarProps) {
  const clamped = Math.max(0, Math.min(100, pct))
  const filled = Math.round((clamped / 100) * segments)
  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' }
  const gaps = { sm: 'gap-[2px]', md: 'gap-[3px]', lg: 'gap-1' }

  return (
    <div className="w-full">
      {(label || showPct) && (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label && <span className="text-sm text-ink-soft dark:text-paper/70">{label}</span>}
          {showPct && <span className="font-display text-sm font-bold tabular-nums">{clamped}%</span>}
        </div>
      )}
      <div className={`flex w-full ${gaps[size]}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[2px] ${heights[size]} transition-colors duration-300 ${
              i < filled ? color : 'bg-paper-sunken dark:bg-dark-surface2'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
