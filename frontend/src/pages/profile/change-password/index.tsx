import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { changePasswordWithOldPassword } from '../../../features/auth/api'
import PasswordInput from '../../../components/ui/PasswordInput'
import PasswordStrengthGauge from '../../../components/ui/PasswordStrengthGauge'

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
  )

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPasswordValue = watch('newPassword', '')

  async function handleFormSubmit(formValues: ChangePasswordFormValues): Promise<void> {
    setServerError(null)
    try {
      await changePasswordWithOldPassword(
        formValues.oldPassword,
        formValues.newPassword,
        formValues.confirmPassword,
      )
      setIsSuccess(true)
      setTimeout(() => navigate('/profile'), 1500)
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error)
      setServerError(errorMessage)
    }
  }

  return (
    <div className="min-h-full" style={{ background: 'var(--color-app-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-text-secondary mb-3"
          aria-label="Retour au profil"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm font-semibold">Retour</span>
        </button>
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Mot de passe
        </h1>
      </div>

      {/* Formulaire */}
      <div className="px-5 py-6">
        {isSuccess ? (
          <div
            className="flex items-center gap-3 px-4 py-4 rounded-2xl"
            style={{ background: 'var(--color-success-tint)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-sm font-bold m-0" style={{ color: 'var(--color-success)' }}>
              Mot de passe modifié avec succès
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">

            {/* Mot de passe actuel */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
                Mot de passe actuel
              </label>
              <PasswordInput
                error={errors.oldPassword?.message}
                {...register('oldPassword')}
              />
            </div>

            {/* Nouveau mot de passe */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
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
                className="text-sm font-semibold text-center py-2 px-4 rounded-xl m-0"
                style={{ color: 'var(--color-danger)', background: 'var(--color-danger-tint)' }}
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-2 transition-opacity disabled:opacity-60"
              style={{ background: '#FF7900' }}
            >
              {isSubmitting ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Une erreur est survenue. Vérifiez votre mot de passe actuel.'
}
