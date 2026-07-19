/**
 * ThemeContext — manages dark / light / OLED mode across the app.
 * Persists to localStorage and applies data-theme attribute on <html>.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const THEMES = ['dark', 'light', 'oled']

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  cycleTheme: () => {},
  themes: THEMES,
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('aniempire-theme')
      return THEMES.includes(saved) ? saved : 'dark'
    } catch {
      return 'dark'
    }
  })

  const setTheme = useCallback((t) => {
    if (!THEMES.includes(t)) return
    setThemeState(t)
    try { localStorage.setItem('aniempire-theme', t) } catch {}
  }, [])

  const cycleTheme = useCallback(() => {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length])
  }, [theme, setTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export default ThemeContext
