const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface MonthCalendarProps {
  year: number
  month: number // 1-indexed
  activeDates: string[] // YYYY-MM-DD
  selectedDate: string | null
  onSelectDate: (dateString: string) => void
  onNavigateMonth: (direction: 'prev' | 'next') => void
}

export default function MonthCalendar({
  year,
  month,
  activeDates,
  selectedDate,
  onSelectDate,
  onNavigateMonth,
}: MonthCalendarProps) {
  const todayString = new Date().toISOString().split('T')[0]
  const activeDateSet = new Set(activeDates)

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
  const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const daysInMonth = new Date(year, month, 0).getDate()
  // getDay() retourne 0=dim, 1=lun... On veut 0=lun → décalage de (day + 6) % 7
  const firstDayOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7

  const calendarCells = buildCalendarCells(firstDayOffset, daysInMonth)

  function buildCalendarCells(offset: number, totalDays: number): (number | null)[] {
    const cells: (number | null)[] = Array(offset).fill(null)
    for (let day = 1; day <= totalDays; day++) {
      cells.push(day)
    }
    return cells
  }

  function formatDateString(day: number): string {
    const paddedMonth = month.toString().padStart(2, '0')
    const paddedDay = day.toString().padStart(2, '0')
    return `${year}-${paddedMonth}-${paddedDay}`
  }

  function isFutureDate(dateString: string): boolean {
    return dateString > todayString
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">

      {/* En-tête : mois + flèches de navigation */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-text-primary">{capitalizedMonthLabel}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onNavigateMonth('prev')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => onNavigateMonth('next')}
            disabled={isFutureDate(formatDateString(1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface transition-colors disabled:opacity-30"
            aria-label="Mois suivant"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Labels des jours de la semaine */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={index} className="text-center text-[11px] font-bold text-text-tertiary py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-y-1">
        {calendarCells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />
          }

          const dateString = formatDateString(day)
          const isSelected = dateString === selectedDate
          const isToday = dateString === todayString
          const isFuture = isFutureDate(dateString)
          const hasActivity = activeDateSet.has(dateString)

          return (
            <button
              key={dateString}
              onClick={() => !isFuture && onSelectDate(dateString)}
              disabled={isFuture}
              className="flex flex-col items-center gap-0.5 py-1 disabled:cursor-default"
              aria-label={dateString}
              aria-pressed={isSelected}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'bg-brand text-white font-bold'
                    : isToday
                      ? 'text-brand font-bold'
                      : isFuture
                        ? 'text-[#D8CFC5]'
                        : 'text-text-primary hover:bg-surface'
                }`}
              >
                {day}
              </div>
              {/* Point vert si activité ce jour */}
              <div className={`w-1 h-1 rounded-full ${hasActivity && !isFuture ? 'bg-success-light' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
