export interface TeamChallengeEntry {
  id: string
  label: string
  current: string
  target: string
  order: number
}

export interface TeamChallengeInput {
  label: string
  current: string
  target: string
}

// Note complète avec données du vendeur — reçue par l'admin
export interface TeamNoteWithUser {
  userId: string
  userName: string
  userColor: string
  userCuid: string
  userRole: string
  publicNote: string | null
  privateNote: string | null
  challenges: TeamChallengeEntry[]
}

// Note publique seulement — reçue par le vendeur pour sa propre fiche
export interface OwnTeamNote {
  publicNote: string | null
  challenges: TeamChallengeEntry[]
}

export interface UpsertTeamNotePayload {
  publicNote?: string
  privateNote?: string
  challenges?: TeamChallengeInput[]
}
