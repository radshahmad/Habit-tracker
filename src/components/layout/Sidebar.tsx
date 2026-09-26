import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Rows3, BarChart3, FileText, ListChecks, Settings } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/tracker', label: 'Tracker', icon: Rows3 },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/habits', label: 'Habits', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/5 bg-paper-raised px-3 py-6 dark:border-white/5 dark:bg-dark-surface lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-growth-500 text-white">
          <CalendarCheck className="h-[18px] w-[18px]" />
        </div>
        <span className="font-display text-base font-extrabold text-ink dark:text-paper">Habits</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-growth-50 text-growth-700 dark:bg-growth-500/15 dark:text-growth-300'
                  : 'text-ink-soft hover:bg-black/5 dark:text-paper/60 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="px-3 text-xs text-ink-soft/60 dark:text-paper/30">Stored only on this device.</p>
    </aside>
  )
}
