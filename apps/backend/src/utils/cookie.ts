import type { Request } from "express";

export function getCookieOptions(req: Request) {
  const host = req.headers.host || "";
  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1");

  return {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? "lax" : "none",
    path: "/",
    domain: isLocal ? undefined : ".openchat.qzz.io",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  } as const;
}

