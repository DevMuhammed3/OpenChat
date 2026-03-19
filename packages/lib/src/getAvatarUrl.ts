export function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return undefined

  if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
    return avatar
  }

  if (avatar.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_URL}${avatar}`
  }

  return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${avatar}`
}
