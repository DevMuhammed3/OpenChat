export type ZoneSummary = {
  publicId: string
  name: string
  avatar?: string | null
}

export type ZoneRole = "OWNER" | "ADMIN" | "MEMBER"

export type ZoneMember = {
  id: number
  username: string
  avatar?: string | null
  role: ZoneRole
  status?: "online" | "offline" | "away" | "dnd"
}

export type ZoneInvite = {
  code: string
  expiresAt: string
}
