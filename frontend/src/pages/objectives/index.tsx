import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import {
  useIndicators,
  useDailySales,
  useMonthlyProgress,
  useSetMonthlyTarget,
} from '../../features/sales/hooks/useSales'
import { useAllUsers } from '../../features/users/hooks/useUsers'
import DailyPointing from '../../features/sales/components/DailyPointing'
import TeamStackedGauges from '../../features/sales/components/TeamStackedGauges'
import MonthlyProgress from '../../features/sales/components/MonthlyProgress'

type MainTab = 'day' | 'month'
type DaySubTab = 'pointing' | 'team'

const TODAY_STRING = new Date().toISOString().split('T')[0]
const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()

function formatTodayDate(): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function ObjectivesPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()

  const [mainTab, setMainTab] = useState<MainTab>('day')
  const [daySubTab, setDaySubTab] = useState<DaySubTab>('pointing')
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [isEditingTargets, setIsEditingTargets] = useState(false)
  // Dictionnaire indicatorId → nouvelle cible saisie par l'admin
  const [targetEdits, setTargetEdits] = useState<Record<string, number | null>>({})

  const isAdmin = currentUser?.role === 'admin'

  const { data: allUsers = [] } = useAllUsers()

  // Admins et vendeurs participent tous aux ventes — le sélecteur inclut tout le monde
  const resolvedVendorId = selectedVendorId || currentUser?.id || ''

  const { data: indicators = [] } = useIndicators()
  const dailyIndicators = indicators.filter((indicator) => indicator.type === 'daily')
  const monthlyIndicators = indicators.filter((indicator) => indicator.type === 'monthly')

  const { data: dailySales = [] } = useDailySales(TODAY_STRING)
  const { data: monthlyProgress = [] } = useMonthlyProgress(
    isAdmin ? resolvedVendorId : (currentUser?.id ?? ''),
    CURRENT_MONTH,
    CURRENT_YEAR,
  )

  const { mutateAsync: saveTarget, isPending: isSavingTargets } = useSetMonthlyTarget(
    CURRENT_MONTH,
    CURRENT_YEAR,
    resolvedVendorId,
  )

  const selectedVendor = allUsers.find((user) => user.id === resolvedVendorId)

  // Réinitialiser l'édition quand on change de vendeur
  useEffect(() => {
    setIsEditingTargets(false)
    setTargetEdits({})
  }, [selectedVendorId])

  function handleVendorSelect(vendorId: string): void {
    setSelectedVendorId(vendorId)
  }

  function handleTargetChange(indicatorId: string, value: number | null): void {
    setTargetEdits((previous) => ({ ...previous, [indicatorId]: value }))
  }

  function handleCancelEdit(): void {
    setIsEditingTargets(false)
    setTargetEdits({})
  }

  async function handleSaveTargets(): Promise<void> {
    const indicatorIdsWithChanges = Object.keys(targetEdits)

    for (const indicatorId of indicatorIdsWithChanges) {
      const newTarget = targetEdits[indicatorId]
      if (newTarget === null) continue

      await saveTarget({
        userId: resolvedVendorId,
        indicatorId,
        month: CURRENT_MONTH,
        year: CURRENT_YEAR,
        target: newTarget,
      })
    }

    setIsEditingTargets(false)
    setTargetEdits({})
  }

  if (!currentUser) return null

  return (
    <div className="min-h-full">

      {/* Header + onglets — sticky */}
      <div className="sticky top-0 z-10 bg-app-bg">
        <div className="px-5 pt-12 pb-4 flex items-start justify-between">
          <div>
            <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
              Objectifs
            </h1>
            <p className="text-sm text-text-secondary mt-0.5 m-0">{formatTodayDate()}</p>
          </div>

          {/* Bouton gestion indicateurs (admin uniquement) */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/indicators')}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-xs font-bold text-text-secondary"
              title="Gérer les indicateurs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Gérer
            </button>
          )}
        </div>

        {/* Onglets Jour / Mois */}
        <div className="flex border-b border-border-soft px-5 gap-1">
          {(['day', 'month'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`pb-3 px-3 text-sm font-bold transition-colors relative ${
                mainTab === tab ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {tab === 'day' ? 'Jour' : 'Mois'}
              {mainTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">

        {/* ── Onglet Jour ── */}
        {mainTab === 'day' && (
          <>
            <div className="flex bg-surface rounded-2xl p-1 mb-4">
              {([['pointing', '✎ Je pointe'], ['team', 'Équipe']] as [DaySubTab, string][]).map(([sub, label]) => (
                <button
                  key={sub}
                  onClick={() => setDaySubTab(sub)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    daySubTab === sub
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {daySubTab === 'pointing' && (
              <DailyPointing
                indicators={dailyIndicators}
                dailySales={dailySales}
                currentUserId={currentUser.id}
                currentUserColor={currentUser.color}
                dateString={TODAY_STRING}
              />
            )}

            {daySubTab === 'team' && (
              <TeamStackedGauges
                indicators={dailyIndicators}
                dailySales={dailySales}
                currentUserId={currentUser.id}
              />
            )}
          </>
        )}

        {/* ── Onglet Mois ── */}
        {mainTab === 'month' && (
          <>
            {/* Sélecteur de vendeur — admin uniquement */}
            {isAdmin && allUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-2 m-0">
                  Membre consulté
                </p>
                <div className="flex gap-2 flex-wrap">
                  {allUsers.map((vendor) => {
                    const isSelected = resolvedVendorId === vendor.id
                    return (
                      <button
                        key={vendor.id}
                        onClick={() => handleVendorSelect(vendor.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: isSelected ? vendor.color : 'var(--color-surface)',
                          color: isSelected ? 'white' : 'var(--color-text-secondary)',
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{
                            background: isSelected ? 'rgba(255,255,255,0.25)' : vendor.color,
                            color: 'white',
                          }}
                        >
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                        {vendor.name}
                      </button>
                    )
                  })}
                </div>

                {/* Bouton modifier les objectifs — visible hors mode édition */}
                {!isEditingTargets && (
                  <button
                    onClick={() => setIsEditingTargets(true)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: '#FFF3E6', color: '#FF7900' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Modifier les objectifs de {selectedVendor?.name ?? '…'}
                  </button>
                )}
              </div>
            )}

            {/* Saisie des indicateurs mensuels (occasionnels, non-journaliers) */}
            {monthlyIndicators.length > 0 && (
              <div className="mb-4">
                <DailyPointing
                  indicators={monthlyIndicators}
                  dailySales={dailySales}
                  currentUserId={currentUser.id}
                  currentUserColor={currentUser.color}
                  dateString={TODAY_STRING}
                  showTeamTotal={false}
                  sectionTitle="Saisie mensuelle"
                />
              </div>
            )}

            <MonthlyProgress
              progressEntries={monthlyProgress}
              month={CURRENT_MONTH}
              year={CURRENT_YEAR}
              vendorName={isAdmin ? selectedVendor?.name : undefined}
              isEditMode={isEditingTargets}
              editableTargets={targetEdits}
              onTargetChange={handleTargetChange}
            />

            {/* Barre actions — visible en mode édition */}
            {isEditingTargets && (
              <div
                className="fixed bottom-14 md:bottom-0 left-0 right-0 md:left-[240px] z-30 px-5 py-4 bg-white border-t border-border-soft flex gap-3"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 rounded-2xl border border-border-soft text-sm font-bold text-text-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTargets}
                  disabled={isSavingTargets || Object.keys(targetEdits).length === 0}
                  className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: '#FF7900' }}
                >
                  {isSavingTargets ? 'Enregistrement…' : `Enregistrer pour ${selectedVendor?.name ?? '…'}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
