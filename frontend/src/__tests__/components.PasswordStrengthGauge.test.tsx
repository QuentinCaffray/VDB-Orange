import { render, screen } from '@testing-library/react'
import PasswordStrengthGauge from '../components/ui/PasswordStrengthGauge'

describe('PasswordStrengthGauge', () => {
  it('n\'affiche pas de texte avec un mot de passe vide', () => {
    render(<PasswordStrengthGauge password="" />)
    expect(screen.queryByText('Mot de passe robuste')).toBeNull()
    // Aucune règle satisfaite → aucun message affiché
    expect(document.querySelector('p')).toBeNull()
  })

  it('affiche le premier critère manquant quand le mot de passe est faible', () => {
    // Seulement une majuscule, pas le reste
    render(<PasswordStrengthGauge password="A" />)
    // La prochaine règle à satisfaire est "8 caractères minimum"
    expect(screen.getByText('8 caractères minimum')).toBeDefined()
  })

  it('affiche "Un chiffre" quand la longueur et la majuscule sont OK', () => {
    render(<PasswordStrengthGauge password="MonMdp!!" />)
    // Longueur ✓, Majuscule ✓, Chiffre ✗ → on affiche "Un chiffre"
    expect(screen.getByText('Un chiffre')).toBeDefined()
  })

  it('affiche "Mot de passe robuste" avec tous les critères satisfaits', () => {
    render(<PasswordStrengthGauge password="MonMdp1!" />)
    expect(screen.getByText('Mot de passe robuste')).toBeDefined()
  })

  it('affiche 4 segments de jauge', () => {
    render(<PasswordStrengthGauge password="" />)
    // 4 règles = 4 segments (divs de jauge)
    const gaugeContainer = document.querySelector('.flex.gap-1\\.5') as HTMLElement
    const segments = gaugeContainer?.querySelectorAll('.flex-1') ?? []
    expect(segments).toHaveLength(4)
  })
})
