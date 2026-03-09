export function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return undefined

  return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${avatar}`
}
