import { z } from 'zod'

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'vendeur']),
})

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

export interface UserSummary {
  id: string
  cuid: string
  name: string
  role: string
  color: string
}
