// Formate une date en YYYY-MM-DD en heure locale.
// toISOString() donne la date UTC, ce qui peut décaler d'un jour
// si le navigateur est en UTC+1/+2 et qu'il est passé minuit local.
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
