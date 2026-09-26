import { useEffect, useState } from 'react'
import { useSettings } from './useSettings'

/** Applies the resolved theme (light/dark/system) to the <html> element. */
export function useAppliedTheme(): 'light' | 'dark' {
  const settings = useSettings()
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  const resolved: 'light' | 'dark' =
    settings.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : settings.theme

  useEffect(() => {
    const root = document.documentElement
    if (resolved === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [resolved])

  return resolved
}
