import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { activateAccountWithNewPassword } from '../../features/auth/api'
import { useAuthContext } from '../../context/AuthContext'
import PasswordInput from '../../components/ui/PasswordInput'
import PasswordStrengthGauge from '../../components/ui/PasswordStrengthGauge'

const activateFormSchema = z
  .object({
    newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmez votre mot de passe'),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
  )

type ActivateFormValues = z.infer<typeof activateFormSchema>

export default function ActivatePage() {
  const navigate = useNavigate()
  const { currentUser, handleLoginSuccess } = useAuthContext()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivateFormValues>({
    resolver: zodResolver(activateFormSchema),
  })

  const newPasswordValue = watch('newPassword', '')

  async function handleFormSubmit(formValues: ActivateFormValues): Promise<void> {
    setServerError(null)
    try {
      const { accessToken, refreshToken, user } = await activateAccountWithNewPassword(
        formValues.newPassword,
        formValues.confirmPassword,
      )
      handleLoginSuccess({ accessToken, refreshToken }, user)
      navigate('/tasks', { replace: true })
    } catch {
      setServerError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="h-dvh flex flex-col overflow-y-auto" style={{ background: 'var(--color-app-bg)' }}>

      {/* Header avec retour */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <button
          onClick={() => navigate('/login')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-surface)' }}
          aria-label="Retour à la connexion"
        >
          <ChevronLeftIcon />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 px-6 pb-10 flex flex-col gap-6">

        {/* Titre personnalisé */}
        <div className="flex flex-col gap-1">
          <h1
            className="text-4xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            Bienvenue, {currentUser?.name} !
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Pour sécuriser votre accès, choisissez un mot de passe personnel.
          </p>
        </div>

        {/* Bandeau informatif */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--color-brand-tint)' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: '#FF7900' }}
          >
            <span className="text-white text-xs font-black">!</span>
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: '#FF7900', opacity: 0.85 }}>
            Ce mot de passe remplace celui fourni par la direction.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          {/* Nouveau mot de passe */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Nouveau mot de passe
            </label>
            <PasswordInput
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            {newPasswordValue.length > 0 && (
              <PasswordStrengthGauge password={newPasswordValue} />
            )}
          </div>

          {/* Confirmation */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Confirmer
            </label>
            <PasswordInput
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Erreur serveur */}
          {serverError && (
            <p
              className="text-sm font-semibold text-center py-2 px-4 rounded-xl"
              style={{ color: 'var(--color-danger)', background: 'var(--color-danger-tint)' }}
            >
              {serverError}
            </p>
          )}

          {/* Bouton activation */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl text-white font-bold text-base mt-2 transition-opacity"
            style={{
              background: '#FF7900',
              boxShadow: '0 8px 18px rgba(255,121,0,0.3)',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Activation…' : 'Activer mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
