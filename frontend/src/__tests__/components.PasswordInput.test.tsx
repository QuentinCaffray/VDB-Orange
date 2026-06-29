import { render, screen, fireEvent } from '@testing-library/react'
import PasswordInput from '../components/ui/PasswordInput'

describe('PasswordInput', () => {
  it('affiche un champ de type password par défaut', () => {
    render(<PasswordInput />)
    // Les inputs type=password n'ont pas de role ARIA textbox — on cible par attribut
    expect(document.querySelector('input[type="password"]')).toBeTruthy()
  })

  it('affiche le label si fourni', () => {
    render(<PasswordInput label="Mot de passe" />)
    expect(screen.getByText('Mot de passe')).toBeDefined()
  })

  it('bascule le type en text quand on clique sur le bouton de visibilité', () => {
    render(<PasswordInput />)

    const input = document.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('password')

    const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i })
    fireEvent.click(toggleButton)

    expect(input.type).toBe('text')
  })

  it('rebascule en password lors d\'un second clic', () => {
    render(<PasswordInput />)

    const input = document.querySelector('input') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i })

    fireEvent.click(toggleButton)
    expect(input.type).toBe('text')

    fireEvent.click(screen.getByRole('button', { name: /masquer le mot de passe/i }))
    expect(input.type).toBe('password')
  })

  it('affiche le message d\'erreur si error est défini', () => {
    render(<PasswordInput error="Le mot de passe est requis" />)
    expect(screen.getByText('Le mot de passe est requis')).toBeDefined()
  })

  it('n\'affiche pas de message d\'erreur si error est absent', () => {
    render(<PasswordInput />)
    expect(document.querySelector('p')).toBeNull()
  })

  it('transmet les props HTML au champ input (placeholder, disabled)', () => {
    render(<PasswordInput placeholder="Saisir…" disabled />)
    const input = document.querySelector('input') as HTMLInputElement
    expect(input.placeholder).toBe('Saisir…')
    expect(input.disabled).toBe(true)
  })
})
