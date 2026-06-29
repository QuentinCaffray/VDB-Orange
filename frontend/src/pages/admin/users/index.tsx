import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAllUsers,
  useUpdateUserProfile,
  useAdminResetUserPassword,
  useCreateVendor,
  useUpdateUserRole,
  useDeleteUser,
} from '../../../features/users/hooks/useUsers'
import { useAuthContext } from '../../../context/AuthContext'
import { UserSummary, CreateVendorInput } from '../../../features/users/api'

const CUID_REGEX = /^[A-Z]{4}[0-9]{4}$/
const DEFAULT_VENDOR_COLOR = '#58A6FF'

function formatLastLoginDate(lastLoginAt: string | null): string {
  if (lastLoginAt === null) return 'Connexion inconnue'

  const loginDate = new Date(lastLoginAt)
  const currentYear = new Date().getFullYear()
  const loginYear = loginDate.getFullYear()

  const dayAndMonth = loginDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  if (loginYear !== currentYear) {
    return `vu le ${dayAndMonth} ${loginYear}`
  }

  return `vu le ${dayAndMonth}`
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()
  const { data: users = [], isLoading } = useAllUsers()
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  function handleBackClick(): void {
    navigate('/profile')
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-1.5 text-text-secondary mb-3"
          aria-label="Retour au profil"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm font-semibold">Retour</span>
        </button>
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Gestion des comptes
        </h1>
        <p className="text-sm text-text-secondary mt-0.5 m-0">
          {isLoading ? 'Chargement…' : `${users.length} membre${users.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Liste des membres */}
      <div className="flex-1 px-5 py-4 pb-32 flex flex-col gap-3">
        {users.map((user) => (
          <UserManagementCard key={user.id} user={user} currentAdminId={currentUser?.id ?? ''} />
        ))}
      </div>

      {/* Bouton flottant Ajouter */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-app-bg border-t border-border-soft md:left-60">
        <button
          onClick={() => setIsAddFormOpen(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: '#FF7900' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter un vendeur
        </button>
      </div>

      {/* Formulaire d'ajout — portail pour échapper à overflow-y: auto du main */}
      {isAddFormOpen && createPortal(
        <AddVendorForm onClose={() => setIsAddFormOpen(false)} />,
        document.body,
      )}
    </div>
  )
}

// ── Carte de gestion d'un utilisateur ────────────────────────────────────────

interface UserManagementCardProps {
  user: UserSummary
  currentAdminId: string
}

function UserManagementCard({ user, currentAdminId }: UserManagementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCuidEditing, setIsCuidEditing] = useState(false)
  const [cuidDraft, setCuidDraft] = useState(user.cuid)
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false)
  const [isRoleConfirmOpen, setIsRoleConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [localColor, setLocalColor] = useState(user.color)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateUserProfile()
  const { mutate: resetPassword, isPending: isResettingPassword } = useAdminResetUserPassword()
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole()
  const { mutate: deleteUserMutation, isPending: isDeletingUser } = useDeleteUser()

  const isSelf = user.id === currentAdminId

  // L'événement DOM natif "change" est le seul fiable sur iOS Safari pour
  // détecter la fermeture du color picker natif — onBlur ne fire pas sur iOS.
  useEffect(() => {
    const inputElement = colorInputRef.current
    if (!inputElement) return

    function handleNativeColorChange(event: Event): void {
      const newColor = (event.target as HTMLInputElement).value
      if (newColor !== user.color) {
        updateProfile({ userId: user.id, input: { color: newColor } })
      }
    }

    inputElement.addEventListener('change', handleNativeColorChange)
    return () => inputElement.removeEventListener('change', handleNativeColorChange)
  }, [user.id, user.color, updateProfile])

  function handleColorChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setLocalColor(event.target.value)
  }

  function handleCuidSave(): void {
    const trimmedCuid = cuidDraft.toUpperCase().trim()
    if (!CUID_REGEX.test(trimmedCuid)) return
    if (trimmedCuid === user.cuid) {
      setIsCuidEditing(false)
      return
    }
    updateProfile(
      { userId: user.id, input: { cuid: trimmedCuid } },
      { onSuccess: () => setIsCuidEditing(false) },
    )
  }

  function handleCuidKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') handleCuidSave()
    if (event.key === 'Escape') {
      setCuidDraft(user.cuid)
      setIsCuidEditing(false)
    }
  }

  function handleRoleToggle(): void {
    const newRole = user.role === 'admin' ? 'vendeur' : 'admin'
    updateRole(
      { userId: user.id, role: newRole },
      { onSuccess: () => setIsRoleConfirmOpen(false) },
    )
  }

  const userInitials = user.name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  const roleLabel = user.role === 'admin' ? 'Admin' : 'Vendeur'

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden hover-lift">
      {/* Ligne principale */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar couleur */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 cursor-pointer relative"
          style={{ background: localColor }}
          onClick={() => colorInputRef.current?.click()}
          title="Modifier la couleur"
        >
          {userInitials}
          <input
            ref={colorInputRef}
            type="color"
            value={localColor}
            onChange={handleColorChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label={`Couleur de ${user.name}`}
          />
        </div>

        {/* Nom + rôle + CUID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text-primary m-0 truncate">{user.name}</p>
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                color: user.role === 'admin' ? '#FF7900' : 'var(--color-text-tertiary)',
                background: user.role === 'admin' ? 'var(--color-brand-tint)' : 'var(--color-surface)',
              }}
            >
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-text-secondary m-0 mt-0.5">{user.cuid}</p>

          {/* Statut de connexion */}
          <div className="mt-1">
            {user.isFirstLogin ? (
              <span
                className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-brand-tint)', color: '#FF7900' }}
              >
                ⚠ Jamais connecté
              </span>
            ) : (
              <p className="text-xs text-text-tertiary m-0">
                {formatLastLoginDate(user.lastLoginAt)}
              </p>
            )}
          </div>
        </div>

        {/* Bouton expansion */}
        <button
          onClick={() => setIsExpanded((previous) => !previous)}
          className="shrink-0 p-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors"
          aria-label={isExpanded ? 'Réduire' : `Options pour ${user.name}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Panneau d'édition expandé */}
      {isExpanded && (
        <div className="border-t border-border-soft px-4 py-4 flex flex-col gap-4">

          {/* Couleur */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-text-secondary m-0 w-14 shrink-0">Couleur</p>
            <div
              className="w-8 h-8 rounded-full cursor-pointer relative flex items-center justify-center"
              style={{ background: localColor, border: '2px solid var(--color-border)' }}
              onClick={() => colorInputRef.current?.click()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            {isUpdatingProfile && (
              <span className="text-xs text-text-tertiary">Sauvegarde…</span>
            )}
          </div>

          {/* CUID — layout vertical pour éviter l'écrasement */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-secondary m-0">CUID</p>
            {isCuidEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={cuidDraft}
                  onChange={(event) => setCuidDraft(event.target.value.toUpperCase())}
                  onKeyDown={handleCuidKeyDown}
                  maxLength={8}
                  autoFocus
                  placeholder="ABCD1234"
                  className="w-full text-sm font-bold text-center rounded-xl px-3 py-3 outline-none border border-border-soft focus:border-brand uppercase tracking-widest"
                  style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}
                />
                {cuidDraft.length > 0 && !CUID_REGEX.test(cuidDraft.trim()) && (
                  <p className="text-xs text-danger m-0">4 lettres + 4 chiffres (ex : LERN5042)</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCuidDraft(user.cuid); setIsCuidEditing(false) }}
                    className="flex-1 text-sm font-semibold text-text-secondary py-2.5 rounded-xl"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCuidSave}
                    disabled={isUpdatingProfile || !CUID_REGEX.test(cuidDraft.trim())}
                    className="flex-[2] text-sm font-bold text-white py-2.5 rounded-xl disabled:opacity-50"
                    style={{ background: '#FF7900' }}
                  >
                    {isUpdatingProfile ? '…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setCuidDraft(user.cuid); setIsCuidEditing(true) }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left"
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="text-sm font-bold text-text-primary tracking-widest">{user.cuid}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>

          {/* Rôle — admin peut promouvoir/rétrograder (pas soi-même) */}
          {!isSelf && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-text-secondary m-0">Rôle</p>
              {!isRoleConfirmOpen ? (
                <button
                  onClick={() => setIsRoleConfirmOpen(true)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <span className="text-sm font-semibold text-text-primary">
                    {user.role === 'admin' ? 'Admin → Rétrograder vendeur' : 'Vendeur → Promouvoir admin'}
                  </span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <div className="flex flex-col gap-2 px-3 py-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  <p className="text-xs text-text-secondary m-0">
                    {user.role === 'admin'
                      ? `Rétrograder ${user.name} en vendeur ?`
                      : `Promouvoir ${user.name} en admin ?`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRoleConfirmOpen(false)}
                      className="flex-1 text-sm font-semibold text-text-secondary py-2 rounded-xl"
                      style={{ background: 'var(--color-card)' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleRoleToggle}
                      disabled={isUpdatingRole}
                      className="flex-[2] text-sm font-bold text-white py-2 rounded-xl disabled:opacity-50"
                      style={{ background: user.role === 'admin' ? 'var(--color-danger)' : '#FF7900' }}
                    >
                      {isUpdatingRole ? '…' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Réinitialiser le mot de passe */}
          {!isPasswordResetOpen ? (
            <button
              onClick={() => setIsPasswordResetOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-text-secondary py-2.5 px-3 rounded-xl"
              style={{ background: 'var(--color-surface)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Réinitialiser le mot de passe
            </button>
          ) : (
            <PasswordResetInline
              userId={user.id}
              userName={user.name}
              onClose={() => setIsPasswordResetOpen(false)}
              mutate={resetPassword}
              isPending={isResettingPassword}
            />
          )}

          {/* Supprimer le compte — non disponible pour soi-même */}
          {!isSelf && (
            !isDeleteConfirmOpen ? (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl"
                style={{ color: 'var(--color-danger)', background: 'var(--color-danger-tint)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Supprimer le compte
              </button>
            ) : (
              <div className="flex flex-col gap-2 px-3 py-3 rounded-xl" style={{ background: 'var(--color-danger-tint)' }}>
                <p className="text-xs font-semibold m-0" style={{ color: 'var(--color-danger)' }}>
                  Supprimer définitivement {user.name} ? Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="flex-1 text-sm font-semibold text-text-secondary py-2 rounded-xl"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteUserMutation(user.id)}
                    disabled={isDeletingUser}
                    className="flex-[2] text-sm font-bold text-white py-2 rounded-xl disabled:opacity-50"
                    style={{ background: 'var(--color-danger)' }}
                  >
                    {isDeletingUser ? '…' : 'Supprimer'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Formulaire inline de réinitialisation du mot de passe ────────────────────

interface PasswordResetInlineProps {
  userId: string
  userName: string
  onClose: () => void
  mutate: (args: { userId: string; newPassword: string }, options?: { onSuccess?: () => void }) => void
  isPending: boolean
}

function PasswordResetInline({
  userId,
  userName,
  onClose,
  mutate,
  isPending,
}: PasswordResetInlineProps) {
  const [newPassword, setNewPassword] = useState('')
  const [isDone, setIsDone] = useState(false)

  function handleSave(): void {
    if (newPassword.length < 8) return
    mutate(
      { userId, newPassword },
      {
        onSuccess: () => {
          toast.success(`Mot de passe réinitialisé pour ${userName}`)
          setIsDone(true)
          setTimeout(onClose, 1500)
        },
      },
    )
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-success py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Mot de passe réinitialisé pour {userName}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
      <p className="text-xs text-text-secondary m-0">
        Nouveau mot de passe temporaire pour <span className="font-semibold text-text-primary">{userName}</span>
      </p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="8 caractères minimum"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave()
            if (event.key === 'Escape') onClose()
          }}
          className="flex-1 text-sm rounded-xl px-3 py-2 outline-none border border-border-soft focus:border-brand"
          style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={onClose}
          className="shrink-0 text-xs font-semibold text-text-tertiary px-2 py-2"
        >
          ✕
        </button>
        <button
          onClick={handleSave}
          disabled={isPending || newPassword.length < 8}
          className="shrink-0 text-xs font-bold text-white px-3 py-2 rounded-xl disabled:opacity-50"
          style={{ background: '#FF7900' }}
        >
          {isPending ? '…' : 'OK'}
        </button>
      </div>
    </div>
  )
}

// ── Formulaire d'ajout d'un vendeur (bottom sheet) ───────────────────────────

interface AddVendorFormProps {
  onClose: () => void
}

function AddVendorForm({ onClose }: AddVendorFormProps) {
  const [name, setName] = useState('')
  const [cuid, setCuid] = useState('')
  const [password, setPassword] = useState('')
  const [color, setColor] = useState(DEFAULT_VENDOR_COLOR)
  const [errorMessage, setErrorMessage] = useState('')

  const { mutate: createVendor, isPending } = useCreateVendor()

  const isCuidValid = CUID_REGEX.test(cuid.trim())
  const isFormValid = name.trim().length >= 2 && isCuidValid && password.length >= 8

  function handleSubmit(): void {
    if (!isFormValid) return
    setErrorMessage('')

    const input: CreateVendorInput = {
      name: name.trim(),
      cuid: cuid.toUpperCase().trim(),
      password,
      color,
    }

    createVendor(input, {
      onSuccess: () => {
        toast.success(`Compte créé pour ${input.name}`)
        onClose()
      },
      onError: () => setErrorMessage('Erreur lors de la création. Le CUID est peut-être déjà utilisé.'),
    })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] flex flex-col"
        style={{ background: 'var(--color-card)', maxHeight: '90dvh' }}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Titre */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-soft">
          <h2 className="text-lg font-bold text-text-primary m-0">Ajouter un vendeur</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulaire */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Marie Dupont"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none border border-border-soft focus:border-brand"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* CUID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              CUID
            </label>
            <input
              type="text"
              value={cuid}
              onChange={(event) => setCuid(event.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none border border-border-soft focus:border-brand uppercase tracking-widest"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
            {cuid.length > 0 && !isCuidValid && (
              <p className="text-xs text-danger m-0">
                Format : 4 lettres majuscules + 4 chiffres (ex : LERN5042)
              </p>
            )}
          </div>

          {/* Couleur */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              Couleur
            </label>
            <div className="flex items-center gap-3">
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shrink-0"
                style={{ background: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  aria-label="Choisir une couleur"
                />
              </div>
              <span className="text-sm font-mono text-text-secondary">{color}</span>
            </div>
          </div>

          {/* Mot de passe temporaire */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              Mot de passe temporaire
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 caractères minimum"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none border border-border-soft focus:border-brand"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
            <p className="text-xs text-text-tertiary m-0">
              Le vendeur devra changer son mot de passe à la première connexion.
            </p>
          </div>

          {/* Erreur */}
          {errorMessage && (
            <p
              className="text-xs font-semibold rounded-xl px-3 py-2 m-0"
              style={{ color: 'var(--color-danger)', background: 'var(--color-danger-tint)' }}
            >
              {errorMessage}
            </p>
          )}

          {/* Bouton créer */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !isFormValid}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-2 disabled:opacity-40 transition-opacity"
            style={{ background: '#FF7900' }}
          >
            {isPending ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </>
  )
}
