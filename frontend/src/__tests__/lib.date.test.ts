import { getLocalDateString } from '../lib/date'

describe('getLocalDateString', () => {
  it('formate correctement une date locale en YYYY-MM-DD', () => {
    const date = new Date(2026, 0, 15) // 15 janvier 2026 en heure locale
    expect(getLocalDateString(date)).toBe('2026-01-15')
  })

  it('ajoute un zéro devant les mois et jours à un chiffre', () => {
    const date = new Date(2026, 2, 5) // 5 mars
    expect(getLocalDateString(date)).toBe('2026-03-05')
  })

  it('utilise la date du jour si aucun argument n\'est passé', () => {
    const today = new Date()
    const expectedYear = today.getFullYear()
    const expectedMonth = String(today.getMonth() + 1).padStart(2, '0')
    const expectedDay = String(today.getDate()).padStart(2, '0')
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`

    expect(getLocalDateString()).toBe(expected)
  })

  it('ne dépend pas de toISOString (évite le décalage UTC)', () => {
    // toISOString() en UTC+2 à 01h00 local retourne la veille en UTC
    // getLocalDateString doit retourner la date locale, pas la date UTC
    const date = new Date(2026, 5, 29, 1, 0, 0) // 29 juin à 01h locale
    expect(getLocalDateString(date)).toBe('2026-06-29')
  })
})
