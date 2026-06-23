import { useState, forwardRef, InputHTMLAttributes } from 'react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, ...inputProps }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    function handleToggleVisibility(): void {
      setIsPasswordVisible((previous) => !previous)
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPasswordVisible ? 'text' : 'password'}
            className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm font-semibold outline-none transition-colors"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: error ? '1.5px solid var(--color-danger)' : '1.5px solid transparent',
            }}
            {...inputProps}
          />
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            aria-label={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
export default PasswordInput

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0A89F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B0A89F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
