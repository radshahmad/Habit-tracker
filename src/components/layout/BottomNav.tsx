import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Rows3, BarChart3, MoreHorizontal, FileText, ListChecks, Settings, X } from 'lucide-react'

const PRIMARY = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/tracker', label: 'Tracker', icon: Rows3 },
  { to: '/statistics', label: 'Stats', icon: BarChart3 },
]

const MORE = [
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/habits', label: 'Habits', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" role="presentation" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-lg bg-paper-raised p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-raised dark:bg-dark-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">More</h2>
              <button aria-label="Close" onClick={() => setMoreOpen(false)} className="rounded-md p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    setMoreOpen(false)
                    navigate(to)
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-md p-3 text-xs font-medium text-ink-soft hover:bg-black/5 dark:text-paper/70 dark:hover:bg-white/5"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/5 bg-paper-raised pb-[env(safe-area-inset-bottom)] dark:border-white/5 dark:bg-dark-surface lg:hidden"
        aria-label="Primary"
      >
        {PRIMARY.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-growth-600 dark:text-growth-300' : 'text-ink-soft/70 dark:text-paper/50'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-soft/70 dark:text-paper/50"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>
    </>
  )
}
