import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { ThemeType } from '../types'

export function useTheme() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const setThemeExplicit = (t: ThemeType) => setTheme(t)

  return { theme, toggleTheme, setTheme: setThemeExplicit }
}
