import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type ToastKind = 'error' | 'success' | 'info'
interface ToastItem {
  id: string
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastKind, typeof Info> = { error: AlertTriangle, success: CheckCircle2, info: Info }
const COLORS: Record<ToastKind, string> = {
  error: 'border-brick-500/30 text-brick-600 dark:text-brick-400',
  success: 'border-growth-500/30 text-growth-600 dark:text-growth-300',
  info: 'border-black/10 text-ink-soft dark:border-white/10 dark:text-paper/70',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-md border bg-paper-raised px-3.5 py-2.5 text-sm shadow-raised dark:bg-dark-surface ${COLORS[t.kind]}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
