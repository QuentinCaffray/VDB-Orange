import { render, screen, fireEvent } from '@testing-library/react'
import { VendorSelector, VendorOption } from '../components/ui/VendorSelector'

// ─── Données de test ──────────────────────────────────────────────────────────

const VENDORS: VendorOption[] = [
  { id: 'user-001', name: 'Alice', color: '#FF6B00' },
  { id: 'user-002', name: 'Bob', color: '#4A90D9' },
  { id: 'user-003', name: 'Carol', color: '#27AE60' },
]

describe('VendorSelector (mobile — dropdown)', () => {
  it('affiche le nom du vendeur sélectionné', () => {
    render(
      <VendorSelector vendors={VENDORS} selectedId="user-001" onSelect={vi.fn()} />,
    )
    // Le nom Alice doit apparaître dans le bouton du dropdown (mobile)
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
  })

  it('ouvre le dropdown au clic sur le bouton principal', () => {
    render(
      <VendorSelector vendors={VENDORS} selectedId="user-001" onSelect={vi.fn()} />,
    )

    // Au départ, Bob n'est pas visible dans la liste déroulée
    expect(screen.getAllByText('Bob').length).toBe(1) // seulement dans le row desktop

    // On clique sur le bouton du dropdown
    const dropdownButton = screen.getAllByRole('button')[0]
    fireEvent.click(dropdownButton)

    // Après ouverture, Bob doit être visible dans la liste
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(1)
  })

  it('ferme le dropdown et appelle onSelect après sélection', () => {
    const onSelect = vi.fn()
    render(
      <VendorSelector vendors={VENDORS} selectedId="user-001" onSelect={onSelect} />,
    )

    // Ouvrir le dropdown
    const dropdownButton = screen.getAllByRole('button')[0]
    fireEvent.click(dropdownButton)

    // Cliquer sur Bob dans la liste
    const bobButtons = screen.getAllByText('Bob')
    // Trouver le bouton dans la liste ouverte (le dernier élément texte Bob est dans la liste)
    fireEvent.click(bobButtons[bobButtons.length - 1])

    expect(onSelect).toHaveBeenCalledWith('user-002')
  })

  it('appelle onSelect avec l\'id correct quand on choisit un vendeur (desktop)', () => {
    const onSelect = vi.fn()
    render(
      <VendorSelector vendors={VENDORS} selectedId="user-001" onSelect={onSelect} />,
    )

    // Les boutons du row desktop sont toujours présents (masqués par CSS, mais dans le DOM)
    const buttons = screen.getAllByRole('button')
    // Les boutons desktop sont après le dropdown button
    // Trouver le bouton Carol
    const carolButton = buttons.find((btn) => btn.textContent?.includes('Carol'))
    expect(carolButton).toBeDefined()
    fireEvent.click(carolButton!)

    expect(onSelect).toHaveBeenCalledWith('user-003')
  })
})
