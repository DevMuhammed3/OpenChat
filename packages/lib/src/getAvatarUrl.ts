export function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return undefined

  if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
    return avatar
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

  if (avatar.startsWith('/')) {
    return `${baseUrl}${avatar}`
  }

  return `${baseUrl}/uploads/${avatar}`
}
