export function resolveAssetUrl(path?: string | null) {
  if (!path) return null

  if (/^(https?:)?\/\//.test(path)) {
    return path
  }

  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, "")
  if (!baseUrl) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/uploads/${path}`
  return `${baseUrl}${normalizedPath}`
}
