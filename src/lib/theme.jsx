import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'sombre' } catch { return 'sombre' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'sombre' ? 'sombre' : '')
    try { localStorage.setItem('theme', theme) } catch { /* ignore */ }
  }, [theme])

  const basculerTheme = () => setTheme((t) => (t === 'sombre' ? 'clair' : 'sombre'))
  return <ThemeContext.Provider value={{ theme, basculerTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
