'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setForceLight: (force: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  setForceLight: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [forceLight, setForceLightState] = useState(false)
  const [mounted, setMounted] = useState(false)

  const applyTheme = useCallback((pref: Theme, systemDark: boolean, force: boolean) => {
    const isDark = !force && (pref === 'dark' || (pref === 'system' && systemDark))
    setResolvedTheme(isDark ? 'dark' : 'light')
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('theme_preference') as Theme | null
    const initial = stored || 'system'
    setThemeState(initial)

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(initial, prefersDark, forceLight)
    setMounted(true)
  }, [applyTheme, forceLight])

  useEffect(() => {
    if (!mounted) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme('system', e.matches, forceLight)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, mounted, applyTheme, forceLight])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme_preference', newTheme)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(newTheme, prefersDark, forceLight)
  }, [applyTheme, forceLight])

  const setForceLight = useCallback((force: boolean) => {
    setForceLightState(force)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, setForceLight }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
