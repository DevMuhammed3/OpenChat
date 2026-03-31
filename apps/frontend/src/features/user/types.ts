export type AppUser = {
  id: number
  name?: string | null
  username: string
  email: string
  emailVerified: boolean
  avatar?: string | null
  bio?: string | null
  createdAt?: string
}
