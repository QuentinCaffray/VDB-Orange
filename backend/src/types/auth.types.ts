import { z } from 'zod'
import { Role } from '@prisma/client'

// ─── Schémas de validation Zod ────────────────────────────────────────────────

// Format CUID Orange : 4 lettres majuscules + 4 chiffres (ex: LERN5042)
const CUID_REGEX = /^[A-Z]{4}[0-9]{4}$/

export const loginSchema = z.object({
  cuid: z.string().regex(CUID_REGEX, 'Format invalide — attendu : 4 lettres + 4 chiffres (ex: LERN5042)'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const activateAccountSchema = z
  .object({
    newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
  )

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
  )

export type LoginInput = z.infer<typeof loginSchema>
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ─── Types de l'utilisateur authentifié ──────────────────────────────────────

export interface AuthenticatedUser {
  id: string
  cuid: string
  name: string
  role: Role
  color: string
  isFirstLogin: boolean
}

export interface JwtPayload {
  userId: string
  role: Role
}
