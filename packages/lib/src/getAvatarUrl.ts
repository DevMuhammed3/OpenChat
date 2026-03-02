export function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return null
  return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${avatar}`
}
