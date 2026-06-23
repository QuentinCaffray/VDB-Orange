import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginWithCuid } from '../../features/auth/api'
import { useAuthContext } from '../../context/AuthContext'
import PasswordInput from '../../components/ui/PasswordInput'

const STORE_NAME = 'Boutique de Sallanches'

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
      className="h-dvh flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #FF7900, #FF9B3D)' }}
    >
      {/* Hero */}
      <div className="shrink-0 flex flex-col items-center pt-14 pb-8 px-6 gap-4">
        <div
          className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 8px 18px rgba(0,0,0,0.15)' }}
        >
          <span className="text-2xl font-black" style={{ color: '#FF7900' }}>O</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1
            className="text-4xl font-semibold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bonjour 👋
          </h1>
          <p
            className="text-lg text-white/80"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            {STORE_NAME}
          </p>
        </div>
      </div>

      {/* Carte de connexion */}
      <div
        className="flex-1 overflow-y-auto rounded-t-3xl px-6 pt-8 pb-10 flex flex-col gap-5"
        style={{
          background: 'var(--color-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          {/* Champ CUID */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Identifiant (CUID)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <PersonIcon />
              </div>
              <input
                {...register('cuid')}
                onChange={handleCuidChange}
                placeholder="LERN5042"
                autoCapitalize="characters"
                autoCorrect="off"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold tracking-widest outline-none uppercase"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: errors.cuid ? '1.5px solid var(--color-danger)' : '1.5px solid transparent',
                }}
              />
            </div>
            {errors.cuid && (
              <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
                {errors.cuid.message}
              </p>
            )}
          </div>

          {/* Champ mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Mot de passe
            </label>
            <PasswordInput
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

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
            className="w-full py-4 rounded-2xl text-white font-bold text-base mt-1 transition-opacity"
            style={{
              background: '#FF7900',
              boxShadow: '0 8px 18px rgba(255,121,0,0.3)',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {/* Lien première connexion */}
        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Première connexion ?{' '}
          <Link to="/login" className="font-bold" style={{ color: '#FF7900' }}>
            Activer mon compte
          </Link>
        </p>
      </div>
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0A89F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}
