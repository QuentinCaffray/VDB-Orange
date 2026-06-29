import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '../hooks/useDarkMode'

// ─── Setup mocks ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'theme'

// matchMedia n'existe pas dans jsdom — on le mocke
function createMatchMediaMock(prefersDark: boolean) {
  return (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: createMatchMediaMock(false),
  })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDarkMode', () => {
  it('démarre en mode clair si localStorage est vide et prefers-color-scheme est light', () => {
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(false)
  })

  it('démarre en mode sombre si prefers-color-scheme est dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(true),
    })
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(true)
  })

  it('priorité au localStorage sur prefers-color-scheme', () => {
    // System en dark mais user a choisi light explicitement
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(true),
    })
    localStorage.setItem(STORAGE_KEY, 'light')

    const { result } = renderHook(() => useDarkMode())
    expect(result.current.isDark).toBe(false)
  })

  it('toggleDarkMode bascule entre light et dark', () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => {
      result.current.toggleDarkMode()
    })
    expect(result.current.isDark).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })
    expect(result.current.isDark).toBe(false)
  })

  it('persiste la préférence dans localStorage', () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('ajoute la classe dark sur <html> quand isDark est true', () => {
    const { result } = renderHook(() => useDarkMode())

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
