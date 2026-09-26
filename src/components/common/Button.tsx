import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-growth-500 text-white hover:bg-growth-600 active:bg-growth-700',
  secondary:
    'bg-paper-sunken text-ink hover:bg-black/10 dark:bg-dark-surface2 dark:text-paper dark:hover:bg-white/10',
  ghost: 'bg-transparent text-ink-soft hover:bg-black/5 dark:text-paper/70 dark:hover:bg-white/5',
  danger: 'bg-brick-500 text-white hover:bg-brick-600',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
