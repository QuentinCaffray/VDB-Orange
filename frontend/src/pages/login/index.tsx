import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) })

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
    // Fond orange — gradient trop spécifique pour une classe Tailwind, inline style justifié
    <div
      className="min-h-dvh flex items-start justify-center"
      style={{ background: 'linear-gradient(170deg, #FF7900, #FF9B3D)' }}
    >
      {/* Conteneur : mobile plein écran, desktop carte centrée (max 480px) */}
      {/* grid-rows-[auto_1fr] garantit que la carte blanche remplit tout l'espace restant */}
      <div className="w-full max-w-[480px] min-h-dvh grid grid-rows-[auto_1fr]">

        {/* Hero — taille naturelle (auto) */}
        <div className="flex flex-col items-center pt-14 pb-8 px-6 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
            <span className="text-2xl font-black text-brand">🍊</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="font-display text-[40px] font-semibold text-white m-0">
              Bonjour 👋
            </h1>
            <p className="font-display text-xl italic text-white/85 m-0">
              {STORE_NAME}
            </p>
          </div>
        </div>

        {/* Carte blanche — 1fr = remplit tout l'espace restant */}
        <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 flex flex-col gap-5 overflow-y-auto">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

            {/* Champ CUID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-text-secondary">
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
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold tracking-[0.12em] uppercase outline-none bg-surface text-text-primary border-[1.5px] ${errors.cuid ? 'border-danger' : 'border-transparent'}`}
                />
              </div>
              {errors.cuid && (
                <p className="text-xs font-semibold text-danger m-0">{errors.cuid.message}</p>
              )}
            </div>

            {/* Champ mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-text-secondary">
                Mot de passe
              </label>
              <PasswordInput error={errors.password?.message} {...register('password')} />
            </div>

            {/* Erreur serveur */}
            {serverError && (
              <p className="text-sm font-semibold text-center py-2 px-4 rounded-xl text-danger bg-[#FDF2F2] m-0">
                {serverError}
              </p>
            )}

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-2 rounded-2xl bg-brand text-white font-bold text-base shadow-[0_8px_18px_rgba(255,121,0,0.3)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-[13px] text-text-tertiary m-0 leading-relaxed">
            Première connexion ? Utilisez les identifiants fournis par la direction — vous serez invité à définir votre mot de passe.
          </p>
        </div>
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
