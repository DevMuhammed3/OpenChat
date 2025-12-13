import type { Request } from 'express'

export function getCookieOptions(req: Request) {
  const origin = req.headers.origin || ''
  const isLocal = origin.includes('localhost')

  return {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'lax' : 'none',
    path: '/',
    domain: isLocal ? undefined : '.openchat.qzz.io',
    maxAge: 60 * 60 * 24 * 7,
  } as const
}
