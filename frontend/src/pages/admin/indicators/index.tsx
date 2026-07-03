import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useIndicators,
  useCreateIndicator,
  useUpdateIndicator,
  useReorderIndicators,
  useDeleteIndicator,
} from '../../../features/sales/hooks/useSales'
import { Indicator, IndicatorType } from '../../../types/sales.types'

interface IndicatorDraft {
  id: string | null
  name: string
  type: IndicatorType
  order: number
  isNew: boolean
}

function buildInitialDrafts(indicators: Indicator[]): IndicatorDraft[] {
  return indicators.map((indicator) => ({
    id: indicator.id,
    name: indicator.name,
    type: indicator.type,
    order: indicator.order,
    isNew: false,
  }))
}

export default function AdminManageIndicatorsPage() {
  const navigate = useNavigate()
  const { data: indicators = [] } = useIndicators()
  const { mutateAsync: createIndicatorAsync, isPending: isCreating } = useCreateIndicator()
  const { mutateAsync: updateIndicatorAsync, isPending: isUpdating } = useUpdateIndicator()
  const { mutateAsync: reorderIndicatorsAsync } = useReorderIndicators()
  const { mutate: deleteIndicator } = useDeleteIndicator()

  const [drafts, setDrafts] = useState<IndicatorDraft[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (indicators.length === 0) return
    if (hasInitialized.current) return
    hasInitialized.current = true
    setDrafts(buildInitialDrafts(indicators))
  }, [indicators])

  function handleNameChange(index: number, newName: string): void {
    setDrafts((previous) =>
      previous.map((draft, i) => (i === index ? { ...draft, name: newName } : draft)),
    )
  }

  function handleTypeChange(index: number, newType: IndicatorType): void {
    setDrafts((previous) =>
      previous.map((draft, i) => (i === index ? { ...draft, type: newType } : draft)),
    )
  }

  function handleAddIndicator(): void {
    const nextOrder = drafts.length > 0 ? Math.max(...drafts.map((d) => d.order)) + 1 : 0
    const newDraft: IndicatorDraft = {
      id: null,
      name: '',
      type: 'daily',
      order: nextOrder,
      isNew: true,
    }
    setDrafts((previous) => [...previous, newDraft])
  }

  function handleDeleteIndicator(index: number): void {
    const draft = drafts[index]

    if (draft.isNew) {
      setDrafts((previous) => previous.filter((_, i) => i !== index))
      return
    }

    if (!draft.id) return

    setDrafts((previous) => previous.filter((_, i) => i !== index))
    toast.success('Indicateur supprimé')
    deleteIndicator(draft.id)
  }

  async function handleMoveUp(globalIndex: number): Promise<void> {
    const sectionType = drafts[globalIndex].type
    const sectionDrafts = drafts
      .filter((draft) => draft.type === sectionType)
      .sort((a, b) => a.order - b.order)
    const positionInSection = sectionDrafts.indexOf(drafts[globalIndex])

    if (positionInSection <= 0) return

    const previousDraft = sectionDrafts[positionInSection - 1]
    const previousGlobalIndex = drafts.indexOf(previousDraft)
    const currentOrder = drafts[globalIndex].order
    const previousOrder = previousDraft.order

    const updatedDrafts = drafts.map((draft, i) => {
      if (i === globalIndex) return { ...draft, order: previousOrder }
      if (i === previousGlobalIndex) return { ...draft, order: currentOrder }
      return draft
    })
    setDrafts(updatedDrafts)

    const orderedIds = updatedDrafts
      .filter((draft) => draft.id !== null)
      .sort((a, b) => a.order - b.order)
      .map((draft) => draft.id!)

    await reorderIndicatorsAsync(orderedIds)
  }

  async function handleMoveDown(globalIndex: number): Promise<void> {
    const sectionType = drafts[globalIndex].type
    const sectionDrafts = drafts
      .filter((draft) => draft.type === sectionType)
      .sort((a, b) => a.order - b.order)
    const positionInSection = sectionDrafts.indexOf(drafts[globalIndex])

    if (positionInSection >= sectionDrafts.length - 1) return

    const nextDraft = sectionDrafts[positionInSection + 1]
    const nextGlobalIndex = drafts.indexOf(nextDraft)
    const currentOrder = drafts[globalIndex].order
    const nextOrder = nextDraft.order

    const updatedDrafts = drafts.map((draft, i) => {
      if (i === globalIndex) return { ...draft, order: nextOrder }
      if (i === nextGlobalIndex) return { ...draft, order: currentOrder }
      return draft
    })
    setDrafts(updatedDrafts)

    const orderedIds = updatedDrafts
      .filter((draft) => draft.id !== null)
      .sort((a, b) => a.order - b.order)
      .map((draft) => draft.id!)

    await reorderIndicatorsAsync(orderedIds)
  }

  function validateDrafts(): string | null {
    const newDrafts = drafts.filter((draft) => draft.isNew)

    for (const draft of newDrafts) {
      if (!draft.name.trim()) return "Un nouvel indicateur n'a pas de nom."

      const nameAlreadyExists = indicators.some(
        (existing) => existing.name.toLowerCase() === draft.name.trim().toLowerCase(),
      )
      if (nameAlreadyExists) {
        return `"${draft.name.trim()}" existe déjà. Modifiez-le directement dans la liste plutôt que d'en créer un nouveau.`
      }
    }

    const allNames = drafts.map((d) => d.name.trim().toLowerCase()).filter(Boolean)
    const hasDuplicates = allNames.length !== new Set(allNames).size
    if (hasDuplicates) return 'Deux indicateurs ont le même nom.'

    return null
  }

  async function handleSave(): Promise<void> {
    setErrorMessage(null)

    const validationError = validateDrafts()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)

    try {
      for (const draft of drafts) {
        if (draft.isNew && draft.name.trim()) {
          await createIndicatorAsync({
            name: draft.name.trim(),
            type: draft.type,
            order: draft.order,
          })
        } else if (!draft.isNew && draft.id) {
          await updateIndicatorAsync({
            id: draft.id,
            payload: { name: draft.name.trim(), type: draft.type },
          })
        }
      }

      toast.success('Indicateurs enregistrés')
      navigate('/objectives')
    } catch {
      setErrorMessage("Une erreur est survenue lors de l'enregistrement.")
    } finally {
      setIsSaving(false)
    }
  }

  const dailyDrafts = drafts.filter((draft) => draft.type === 'daily').sort((a, b) => a.order - b.order)
  const monthlyDrafts = drafts.filter((draft) => draft.type === 'monthly').sort((a, b) => a.order - b.order)
  const isPendingAny = isSaving || isCreating || isUpdating

  return (
    <div className="min-h-full">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-app-bg border-b border-border-soft">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button
            onClick={() => navigate('/objectives')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface"
            aria-label="Retour aux objectifs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="font-display text-[26px] font-semibold text-text-primary leading-tight m-0">
              Gérer les indicateurs
            </h1>
            <p className="text-xs text-text-tertiary m-0">Renommer · type · ajouter · retirer</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 pb-32">

        <IndicatorSection
          title="Journaliers"
          subtitle="cumulés vers le mois"
          drafts={dailyDrafts}
          allDrafts={drafts}
          onNameChange={handleNameChange}
          onTypeChange={handleTypeChange}
          onDelete={handleDeleteIndicator}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />

        <IndicatorSection
          title="Mensuels uniquement"
          subtitle="non cumulés depuis les ventes journalières"
          drafts={monthlyDrafts}
          allDrafts={drafts}
          onNameChange={handleNameChange}
          onTypeChange={handleTypeChange}
          onDelete={handleDeleteIndicator}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />

        <button
          onClick={handleAddIndicator}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-border-soft text-sm font-bold text-text-tertiary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter un indicateur
        </button>

        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--color-brand-tint)' }}
        >
          <p className="text-xs font-bold m-0" style={{ color: '#FF7900' }}>
            💡 Les objectifs chiffrés se définissent par vendeur
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: '#FF7900', opacity: 0.75 }}>
            Dans Objectifs → Mois, sélectionnez un vendeur puis "Modifier les objectifs".
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          className="fixed bottom-[88px] left-4 right-4 md:left-[256px] z-30 px-4 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--color-danger-tint)', color: 'var(--color-danger)' }}
        >
          {errorMessage}
        </div>
      )}

      {/* Barre actions fixe */}
      <div
        className="fixed bottom-14 md:bottom-0 left-0 right-0 md:left-[240px] px-5 py-4 bg-white border-t border-border-soft flex gap-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => navigate('/objectives')}
          className="flex-1 py-3 rounded-2xl border border-border-soft text-sm font-bold text-text-secondary"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={isPendingAny}
          className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#FF7900' }}
        >
          {isPendingAny ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

interface IndicatorSectionProps {
  title: string
  subtitle: string
  drafts: IndicatorDraft[]
  allDrafts: IndicatorDraft[]
  onNameChange: (globalIndex: number, value: string) => void
  onTypeChange: (globalIndex: number, value: IndicatorType) => void
  onDelete: (globalIndex: number) => void
  onMoveUp: (globalIndex: number) => Promise<void>
  onMoveDown: (globalIndex: number) => Promise<void>
}

function IndicatorSection({
  title,
  subtitle,
  drafts,
  allDrafts,
  onNameChange,
  onTypeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: IndicatorSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const savedPositionsRef = useRef<Map<string, number>>(new Map())

  useLayoutEffect(() => {
    if (!containerRef.current) return

    const cards = containerRef.current.querySelectorAll<HTMLElement>('[data-indicator-id]')

    // Applique la technique FLIP : anime depuis l'ancienne position vers la nouvelle
    cards.forEach((card) => {
      const indicatorId = card.getAttribute('data-indicator-id')!
      const previousTop = savedPositionsRef.current.get(indicatorId)
      if (previousTop === undefined) return
      const currentTop = card.getBoundingClientRect().top
      const delta = previousTop - currentTop
      if (Math.abs(delta) < 1) return

      card.style.transition = 'none'
      card.style.transform = `translateY(${delta}px)`
      void card.offsetHeight // Force le recalcul de layout avant d'animer
      card.style.transition = 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)'
      card.style.transform = ''
    })

    // Sauvegarde les positions actuelles pour la prochaine animation
    cards.forEach((card) => {
      savedPositionsRef.current.set(
        card.getAttribute('data-indicator-id')!,
        card.getBoundingClientRect().top,
      )
    })
  }, [drafts])

  if (drafts.length === 0) return null

  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0">
          {title}
        </p>
        <p className="text-xs text-text-tertiary m-0 mt-0.5">{subtitle}</p>
      </div>

      <div ref={containerRef} className="flex flex-col gap-2">
        {drafts.map((draft) => {
          const globalIndex = allDrafts.indexOf(draft)
          const positionInSection = drafts.indexOf(draft)
          const isFirst = positionInSection === 0
          const isLast = positionInSection === drafts.length - 1
          return (
            <div
              key={draft.id ?? `new-${globalIndex}`}
              data-indicator-id={draft.id ?? `new-${globalIndex}`}
            >
              <IndicatorRow
                draft={draft}
                isFirstInSection={isFirst}
                isLastInSection={isLast}
                onNameChange={(value) => onNameChange(globalIndex, value)}
                onTypeChange={(value) => onTypeChange(globalIndex, value)}
                onDelete={() => onDelete(globalIndex)}
                onMoveUp={() => onMoveUp(globalIndex)}
                onMoveDown={() => onMoveDown(globalIndex)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface IndicatorRowProps {
  draft: IndicatorDraft
  isFirstInSection: boolean
  isLastInSection: boolean
  onNameChange: (value: string) => void
  onTypeChange: (value: IndicatorType) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function IndicatorRow({
  draft,
  isFirstInSection,
  isLastInSection,
  onNameChange,
  onTypeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: IndicatorRowProps) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-col gap-2">

      {/* Ligne principale : nom + type + supprimer */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={draft.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Nom de l'indicateur…"
          className="flex-1 min-w-0 text-sm font-bold text-text-primary bg-surface rounded-xl px-3 py-2 outline-none border border-transparent focus:border-brand"
        />

        <button
          onClick={() => onTypeChange(draft.type === 'daily' ? 'monthly' : 'daily')}
          className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-lg"
          style={{
            background: draft.type === 'daily' ? 'var(--color-brand-tint)' : 'var(--color-monthly-tint)',
            color: draft.type === 'daily' ? '#FF7900' : '#6366F1',
          }}
          title="Cliquer pour changer le type"
        >
          {draft.type === 'daily' ? 'JOUR' : 'MOIS'}
        </button>

        <button
          onClick={onDelete}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-danger"
          aria-label={`Supprimer ${draft.name}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Ligne secondaire : réorganisation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMoveUp}
          disabled={isFirstInSection || draft.isNew}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary disabled:opacity-30"
          style={{ background: 'var(--color-surface)' }}
          aria-label="Monter"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>

        <button
          onClick={onMoveDown}
          disabled={isLastInSection || draft.isNew}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary disabled:opacity-30"
          style={{ background: 'var(--color-surface)' }}
          aria-label="Descendre"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
