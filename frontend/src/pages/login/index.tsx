import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginWithCuid } from '../../features/auth/api'
import { useAuthContext } from '../../context/AuthContext'
import PasswordInput from '../../components/ui/PasswordInput'

// Format CUID Orange : 4 lettres majuscules + 4 chiffres
const CUID_REGEX = /^[A-Z]{4}[0-9]{4}$/

const loginFormSchema = z.object({
  cuid: z
    .string()
    .min(1, 'Identifiant requis')
    .regex(CUID_REGEX, 'Format attendu : 4 lettres + 4 chiffres (ex: LERN5042)'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { handleLoginSuccess } = useAuthContext()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  })

  function handleCuidChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setValue('cuid', event.target.value.toUpperCase(), { shouldValidate: true })
  }

  async function handleFormSubmit(formValues: LoginFormValues): Promise<void> {
    setServerError(null)
    try {
      const { accessToken, refreshToken, user } = await loginWithCuid(
        formValues.cuid,
        formValues.password,
      )
      handleLoginSuccess({ accessToken, refreshToken }, user)
      navigate(user.isFirstLogin ? '/activate' : '/tasks', { replace: true })
    } catch {
      setServerError('Identifiant ou mot de passe incorrect')
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
          Bonjour 👋
        </h1>
      </div>

      {/* Carte de connexion */}
      <div
        className="flex-1 rounded-t-3xl px-6 pt-8 pb-10 flex flex-col gap-6"
        style={{
          background: 'var(--color-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Connexion
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Entrez votre identifiant et mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Champ CUID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Identifiant (CUID)
            </label>
            <input
              {...register('cuid')}
              onChange={handleCuidChange}
              placeholder="ex: LERN5042"
              autoCapitalize="characters"
              autoCorrect="off"
              className="w-full px-4 py-3 rounded-[14px] text-sm font-semibold tracking-widest outline-none transition-colors uppercase"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: errors.cuid ? '1.5px solid var(--color-danger)' : '1.5px solid transparent',
              }}
            />
            {errors.cuid && (
              <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
                {errors.cuid.message}
              </p>
            )}
          </div>

          {/* Champ mot de passe */}
          <PasswordInput
            label="Mot de passe"
            error={errors.password?.message}
            {...register('password')}
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

          {/* Bouton connexion */}
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
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Identifiant fourni par la direction
        </p>
      </div>
    </div>
  )
}
