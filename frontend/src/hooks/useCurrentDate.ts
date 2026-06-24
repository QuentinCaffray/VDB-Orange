import { useState, useEffect } from 'react'

interface CurrentDate {
  month: number
  year: number
  dateString: string
}

function buildCurrentDate(date: Date): CurrentDate {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    dateString: date.toISOString().split('T')[0],
  }
}

function computeMsUntilMidnight(date: Date): number {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return midnight.getTime() - date.getTime()
}

export function useCurrentDate(): CurrentDate {
  const [currentDate, setCurrentDate] = useState<CurrentDate>(() => buildCurrentDate(new Date()))

  useEffect(() => {
    const msUntilMidnight = computeMsUntilMidnight(new Date())
    const timer = setTimeout(() => {
      setCurrentDate(buildCurrentDate(new Date()))
    }, msUntilMidnight)

    return () => clearTimeout(timer)
  }, [currentDate])
  // Re-schedule après chaque changement de date (minuit → reschedule pour minuit suivant)

  return currentDate
}
