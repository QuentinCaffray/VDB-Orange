import { createContext, useContext, ReactNode } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

interface DarkModeContextValue {
  isDark: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null)

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const darkMode = useDarkMode()
  return <DarkModeContext.Provider value={darkMode}>{children}</DarkModeContext.Provider>
}

export function useDarkModeContext(): DarkModeContextValue {
  const context = useContext(DarkModeContext)
  if (!context) throw new Error('useDarkModeContext doit être utilisé à l\'intérieur de DarkModeProvider')
  return context
}
