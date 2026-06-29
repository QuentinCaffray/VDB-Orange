import { render, screen, fireEvent } from '@testing-library/react'
import { DarkModeProvider, useDarkModeContext } from '../context/DarkModeContext'

// ─── Setup mocks ──────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
})

// ─── Composant consommateur de test ──────────────────────────────────────────

function DarkModeTestConsumer() {
  const { isDark, toggleDarkMode } = useDarkModeContext()
  return (
    <div>
      <span data-testid="mode">{isDark ? 'dark' : 'light'}</span>
      <button onClick={toggleDarkMode}>toggle</button>
    </div>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DarkModeContext', () => {
  it('fournit isDark et toggleDarkMode aux composants enfants', () => {
    render(
      <DarkModeProvider>
        <DarkModeTestConsumer />
      </DarkModeProvider>,
    )

    expect(screen.getByTestId('mode').textContent).toBe('light')

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByTestId('mode').textContent).toBe('dark')
  })

  it('useDarkModeContext lance une erreur hors du Provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<DarkModeTestConsumer />)).toThrow(
      'useDarkModeContext doit être utilisé à l\'intérieur de DarkModeProvider',
    )

    consoleError.mockRestore()
  })
})
