import { getApiBaseUrl } from "./config"

export function getAvatarUrl(avatar?: string | null) {
  if (!avatar) return undefined

  if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
    return avatar
  }

  // Use the same resolution logic everywhere (Electron runtime config > env > default).
  // This keeps desktop builds working even when env vars aren't set at build-time.
  const baseUrl = getApiBaseUrl()

  if (avatar.startsWith('/')) {
    return `${baseUrl}${avatar}`
  }

  return `${baseUrl}/uploads/${avatar}`
}
