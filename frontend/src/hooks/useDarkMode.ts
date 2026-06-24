import { useState, useEffect } from 'react'

const STORAGE_KEY = 'theme'

function resolveInitialDarkMode(): boolean {
  const storedPreference = localStorage.getItem(STORAGE_KEY)
  if (storedPreference !== null) return storedPreference === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(resolveInitialDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  function toggleDarkMode(): void {
    setIsDark((previous) => !previous)
  }

  return { isDark, toggleDarkMode }
}
