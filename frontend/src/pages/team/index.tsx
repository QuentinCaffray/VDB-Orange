import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useAllTeamNotes, useOwnTeamNote, useUpdateOwnChallenge, useSaveTeamNote } from '../../features/team/hooks/useTeamNotes'
import { TeamNoteWithUser, TeamChallengeEntry, TeamChallengeInput, UpsertTeamNotePayload } from '../../types/team-note.types'
import { VendorSelector, VendorOption } from '../../components/ui/VendorSelector'
import { Skeleton } from '../../components/ui/Skeleton'

function parseProgressNumber(value: string): number {
  return parseFloat(value.replace('%', '').trim()) || 0
}

function computeChallengeRatio(current: string, target: string): number {
  const currentNumber = parseProgressNumber(current)
  const targetNumber = parseProgressNumber(target)
  return targetNumber > 0 ? Math.min(currentNumber / targetNumber, 1) : 0
}

export default function TeamPage() {
  const { currentUser } = useAuthContext()

  if (!currentUser) return null

  if (currentUser.role === 'admin') return <AdminTeamView />
  return <VendorSelfView />
}

// ── Vue admin : sélecteur + éditeur ──────────────────────────────────────

function AdminTeamView() {
  const navigate = useNavigate()
  const { data: teamNotes = [], isLoading } = useAllTeamNotes()
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  useEffect(() => {
    if (teamNotes.length > 0 && !selectedUserId) {
      setSelectedUserId(teamNotes[0].userId)
    }
  }, [teamNotes, selectedUserId])

  const selectedNote = teamNotes.find((note) => note.userId === selectedUserId)

  const vendorOptions: VendorOption[] = teamNotes.map((note) => ({
    id: note.userId,
    name: note.userName,
    color: note.userColor,
  }))

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 border-b border-border-soft">
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Suivi équipe
        </h1>
        <p className="text-sm text-text-secondary mt-0.5 m-0">
          {isLoading ? 'Chargement…' : `${teamNotes.length} vendeurs`}
        </p>
      </div>

      <div className="px-5 py-4 pb-24 flex flex-col gap-4">
        {isLoading && (
          <>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-[200px] w-full" />
          </>
        )}

        {!isLoading && vendorOptions.length > 0 && (
          <VendorSelector
            vendors={vendorOptions}
            selectedId={selectedUserId}
            onSelect={setSelectedUserId}
            label="Membre consulté"
          />
        )}

        {selectedNote && (
          <button
            onClick={() => navigate('/objectives?vendorId=' + selectedNote.userId)}
            className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--color-brand-tint)', color: '#FF7900' }}
          >
            Voir les objectifs
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        )}

        {selectedNote && (
          <SelectedVendorEditor key={selectedNote.userId} note={selectedNote} />
        )}
      </div>
    </div>
  )
}

// ── Éditeur du vendeur sélectionné ───────────────────────────────────────

interface SelectedVendorEditorProps {
  note: TeamNoteWithUser
}

function SelectedVendorEditor({ note }: SelectedVendorEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [draft, setDraft] = useState<UpsertTeamNotePayload>({})
  const { mutateAsync: saveNote, isPending: isSaving } = useSaveTeamNote()

  function handleStartEdit(): void {
    setDraft({
      publicNote: note.publicNote ?? '',
      privateNote: note.privateNote ?? '',
      challenges: note.challenges.map((c) => ({
        label: c.label,
        current: c.current,
        target: c.target,
      })),
    })
    setIsEditMode(true)
  }

  async function handleSave(): Promise<void> {
    await saveNote({ userId: note.userId, payload: draft })
    setIsEditMode(false)
  }

  function handleCancel(): void {
    setIsEditMode(false)
    setDraft({})
  }

  const showPrivateNotes = note.userRole !== 'admin'

  if (isEditMode) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden">
        <TeamNoteEditForm
          draft={draft}
          userColor={note.userColor}
          isSaving={isSaving}
          showPrivateNotes={showPrivateNotes}
          onChange={setDraft}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] px-4 py-4 flex flex-col gap-4">

      {/* Zone partagée */}
      <div>
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-2">
          Points partagés
        </p>
        {note.publicNote ? (
          <p className="text-sm text-text-primary leading-relaxed break-words m-0">{note.publicNote}</p>
        ) : (
          <p className="text-sm text-text-tertiary italic m-0">Aucune note</p>
        )}
      </div>

      {/* Zone privée direction — masquée pour les admins */}
      {showPrivateNotes && (
        <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--color-admin-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-admin-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0">Notes direction</p>
          </div>
          {note.privateNote ? (
            <p className="text-sm text-text-primary leading-relaxed break-words m-0">{note.privateNote}</p>
          ) : (
            <p className="text-sm text-text-tertiary italic m-0">Aucune note</p>
          )}
        </div>
      )}

      {/* Challenges */}
      {note.challenges.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-3">
            Objectifs du mois
          </p>
          <div className="flex flex-col gap-2">
            {note.challenges.map((challenge) => (
              <ChallengeBar
                key={challenge.id}
                challenge={challenge}
                color={note.userColor}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleStartEdit}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-sm font-bold"
        style={{ background: 'var(--color-brand-tint)', color: '#FF7900' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Modifier
      </button>
    </div>
  )
}

// ── Barre de challenge (lecture) ──────────────────────────────────────────

interface ChallengeBarProps {
  challenge: TeamChallengeEntry
  color: string
}

function ChallengeBar({ challenge, color }: ChallengeBarProps) {
  const ratio = computeChallengeRatio(challenge.current, challenge.target)
  const isComplete = ratio >= 1

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: isComplete ? 'var(--color-success-tint)' : 'var(--color-surface)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-text-primary">{challenge.label}</span>
        <span className="text-sm shrink-0 ml-3">
          <span className="font-bold" style={{ color }}>{challenge.current}</span>
          <span className="text-text-tertiary font-normal"> / {challenge.target}</span>
          {isComplete && <span className="ml-1.5 text-[11px] font-bold text-success">✓</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${ratio * 100}%`, background: isComplete ? '#22A650' : color }}
        />
      </div>
    </div>
  )
}

// ── Formulaire d'édition ──────────────────────────────────────────────────

interface TeamNoteEditFormProps {
  draft: UpsertTeamNotePayload
  userColor: string
  isSaving: boolean
  showPrivateNotes: boolean
  onChange: (updatedDraft: UpsertTeamNotePayload) => void
  onSave: () => void
  onCancel: () => void
}

function TeamNoteEditForm({ draft, userColor, isSaving, showPrivateNotes, onChange, onSave, onCancel }: TeamNoteEditFormProps) {
  const challenges = draft.challenges ?? []

  function updateNote(field: 'publicNote' | 'privateNote', value: string): void {
    onChange({ ...draft, [field]: value })
  }

  function updateChallenge(index: number, field: keyof TeamChallengeInput, value: string): void {
    const updated = challenges.map((c, i) => i === index ? { ...c, [field]: value } : c)
    onChange({ ...draft, challenges: updated })
  }

  function addChallenge(): void {
    onChange({ ...draft, challenges: [...challenges, { label: '', current: '0', target: '' }] })
  }

  function removeChallenge(index: number): void {
    onChange({ ...draft, challenges: challenges.filter((_, i) => i !== index) })
  }

  return (
    <div className="border-t border-border-soft px-4 py-4 flex flex-col gap-4">

      {/* Zone partagée */}
      <div>
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-1">Points partagés</p>
        <p className="text-xs text-text-tertiary m-0 mb-2">Visible par le vendeur</p>
        <textarea
          value={draft.publicNote ?? ''}
          onChange={(event) => updateNote('publicNote', event.target.value)}
          placeholder="Axes d'amélioration, points positifs à partager…"
          rows={3}
          className="w-full text-sm text-text-primary bg-surface rounded-xl px-3 py-2.5 outline-none border border-transparent focus:border-brand resize-none"
        />
      </div>

      {/* Zone privée direction — masquée pour les admins */}
      {showPrivateNotes && (
        <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={{ background: 'var(--color-admin-bg)' }}>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-admin-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0">Notes direction</p>
          </div>
          <p className="text-xs text-text-tertiary m-0">Confidentielles — jamais visibles par le vendeur</p>
          <textarea
            value={draft.privateNote ?? ''}
            onChange={(event) => updateNote('privateNote', event.target.value)}
            placeholder="Notes internes, observations confidentielles…"
            rows={3}
            className="w-full text-sm text-text-primary bg-white rounded-xl px-3 py-2.5 outline-none border border-transparent focus:border-brand resize-none"
          />
        </div>
      )}

      {/* Challenges */}
      <div>
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-3">Challenges</p>
        <div className="flex flex-col gap-2">
          {challenges.map((challenge, index) => (
            <ChallengeEditRow
              key={index}
              challenge={challenge}
              userColor={userColor}
              onChange={(field, value) => updateChallenge(index, field, value)}
              onRemove={() => removeChallenge(index)}
            />
          ))}
        </div>
        <button
          onClick={addChallenge}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-border-soft text-xs font-bold text-text-tertiary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter un objectif
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-2xl border border-border-soft text-sm font-bold text-text-secondary"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-[2] py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: '#FF7900' }}
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ── Ligne d'édition d'un challenge ────────────────────────────────────────

interface ChallengeEditRowProps {
  challenge: TeamChallengeInput
  userColor: string
  onChange: (field: keyof TeamChallengeInput, value: string) => void
  onRemove: () => void
}

function ChallengeEditRow({ challenge, userColor, onChange, onRemove }: ChallengeEditRowProps) {
  const ratio = computeChallengeRatio(challenge.current, challenge.target)

  return (
    <div className="bg-surface rounded-2xl px-3 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={challenge.label}
          onChange={(event) => onChange('label', event.target.value)}
          placeholder="Ex : Atteindre 20 HD, 5 ABO…"
          className="flex-1 text-sm font-semibold text-text-primary bg-white rounded-xl px-3 py-2 outline-none border border-transparent focus:border-brand"
        />
        <button
          onClick={onRemove}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-text-tertiary hover:text-danger"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary font-semibold">En cours</span>
          <input
            type="text"
            value={challenge.current}
            onChange={(event) => onChange('current', event.target.value)}
            placeholder="0"
            className="w-full text-sm font-bold text-center text-text-primary bg-white rounded-xl px-3 py-2 outline-none border border-transparent focus:border-brand"
          />
        </div>
        <span className="text-text-tertiary font-bold pb-2">/</span>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary font-semibold">Objectif</span>
          <input
            type="text"
            value={challenge.target}
            onChange={(event) => onChange('target', event.target.value)}
            placeholder="10"
            className="w-full text-sm font-bold text-center text-text-primary bg-white rounded-xl px-3 py-2 outline-none border border-transparent focus:border-brand"
          />
        </div>
      </div>

      {parseProgressNumber(challenge.target) > 0 && (
        <div className="h-1.5 rounded-full bg-white overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${ratio * 100}%`, background: userColor }}
          />
        </div>
      )}
    </div>
  )
}

// ── Vue vendeur : sa propre fiche ─────────────────────────────────────────

function VendorSelfView() {
  const { currentUser } = useAuthContext()
  const { data: ownNote, isLoading } = useOwnTeamNote()
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const { mutateAsync: updateChallenge, isPending: isUpdating } = useUpdateOwnChallenge()

  if (!currentUser) return null

  async function handleSaveChallenge(): Promise<void> {
    if (!editingChallengeId) return
    await updateChallenge({ challengeId: editingChallengeId, current: editingValue })
    setEditingChallengeId(null)
    setEditingValue('')
  }

  function handleStartEdit(challenge: TeamChallengeEntry): void {
    setEditingChallengeId(challenge.id)
    setEditingValue(challenge.current)
  }

  function handleCancelEdit(): void {
    setEditingChallengeId(null)
    setEditingValue('')
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 border-b border-border-soft">
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Mon suivi
        </h1>
        <p className="text-sm text-text-secondary mt-0.5 m-0">Suivi de ta progression</p>
      </div>

      <div className="px-5 py-4 pb-24 flex flex-col gap-4">

        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{ background: currentUser.color }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary m-0">{currentUser.name}</p>
            <p className="text-sm text-text-secondary m-0">{currentUser.cuid}</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[160px] w-full" />
          </div>
        )}

        {ownNote && (
          <>
            <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-3">
                Points à travailler
              </p>
              {ownNote.publicNote ? (
                <p className="text-sm text-text-primary leading-relaxed break-words m-0">{ownNote.publicNote}</p>
              ) : (
                <p className="text-sm text-text-tertiary m-0">Aucun suivi renseigné pour le moment.</p>
              )}
            </div>

            {ownNote.challenges.length > 0 && (
              <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0 mb-3">
                  Objectifs du mois
                </p>
                <div className="flex flex-col gap-3">
                  {ownNote.challenges.map((challenge) => {
                    const isEditing = editingChallengeId === challenge.id
                    const ratio = computeChallengeRatio(challenge.current, challenge.target)
                    const isComplete = ratio >= 1

                    return (
                      <div
                        key={challenge.id}
                        className="rounded-2xl px-4 py-3"
                        style={{ background: isComplete ? 'var(--color-success-tint)' : 'var(--color-surface)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-text-primary">{challenge.label}</span>
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(challenge)}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 ml-2"
                              style={{ background: 'var(--color-brand-tint)', color: '#FF7900' }}
                            >
                              Mettre à jour
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(event) => setEditingValue(event.target.value)}
                                className="flex-1 text-sm font-bold text-center text-text-primary bg-white rounded-xl px-3 py-2 outline-none border-2 border-brand"
                                autoFocus
                              />
                              <span className="text-sm text-text-tertiary font-semibold shrink-0">
                                / {challenge.target}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 py-2 rounded-xl text-sm font-bold text-text-secondary bg-white"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={handleSaveChallenge}
                                disabled={isUpdating}
                                className="flex-[2] py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                                style={{ background: '#FF7900' }}
                              >
                                {isUpdating ? '…' : 'Enregistrer'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold" style={{ color: isComplete ? '#22A650' : currentUser.color }}>
                                {challenge.current}
                              </span>
                              <span className="text-sm text-text-tertiary">
                                / {challenge.target}
                                {isComplete && <span className="ml-1.5 text-success font-bold">✓</span>}
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${ratio * 100}%`,
                                  background: isComplete ? '#22A650' : currentUser.color,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
