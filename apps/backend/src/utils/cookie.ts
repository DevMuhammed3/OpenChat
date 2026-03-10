import type { Request } from "express";

export function getCookieOptions(_req: Request) {

  const isLocal = process.env.NODE_ENV !== "production";

  return {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? "lax" : "none",
    path: "/",
    domain: isLocal ? undefined : ".qzz.io",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  } as const;
}
