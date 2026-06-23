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
  const { handleLoginSuccess } = useAuthContext()
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
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'linear-gradient(170deg, #FF7900, #FF9B3D)' }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6 gap-5">
        <div
          className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 8px 18px rgba(0,0,0,0.15)' }}
        >
          <span className="text-2xl font-black" style={{ color: '#FF7900' }}>O</span>
        </div>
        <h1
          className="text-4xl font-semibold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Bienvenue 👋
        </h1>
      </div>

      {/* Carte d'activation */}
      <div
        className="flex-1 rounded-t-3xl px-6 pt-8 pb-10 flex flex-col gap-6"
        style={{
          background: 'var(--color-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Bandeau informatif */}
        <div
          className="px-4 py-3 rounded-2xl"
          style={{ background: '#FFF3E6', border: '1px solid #FFD4A3' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#C25E00' }}>
            Première connexion — ce mot de passe remplace celui fourni par la direction
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Choisir mon mot de passe
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Choisissez un mot de passe personnel et sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Nouveau mot de passe */}
          <div className="flex flex-col gap-2">
            <PasswordInput
              label="Nouveau mot de passe"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            {newPasswordValue.length > 0 && (
              <PasswordStrengthGauge password={newPasswordValue} />
            )}
          </div>

          {/* Confirmation */}
          <PasswordInput
            label="Confirmer le mot de passe"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Erreur serveur */}
          {serverError && (
            <p
              className="text-sm font-semibold text-center py-2 px-4 rounded-xl"
              style={{ color: 'var(--color-danger)', background: '#FDF2F2' }}
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
