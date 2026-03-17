import type { Request } from "express";

function normalizeCookieDomain(hostname?: string) {
  if (!hostname) return undefined;

  const host = hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1") {
    return undefined;
  }

  if (host.endsWith(".openchat.qzz.io")) {
    return ".openchat.qzz.io";
  }

  if (host.endsWith(".qzz.io")) {
    return ".qzz.io";
  }

  return undefined;
}

function getCookieDomain(req: Request) {
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();

  if (configuredDomain) {
    return configuredDomain.startsWith(".")
      ? configuredDomain
      : `.${configuredDomain}`;
  }

  const origin = req.get("origin");
  if (origin) {
    try {
      return normalizeCookieDomain(new URL(origin).hostname);
    } catch {
      // Ignore invalid origin and continue with request host fallback.
    }
  }

  return normalizeCookieDomain(req.hostname);
}

export function getCookieOptions(req: Request) {

  const isLocal = process.env.NODE_ENV !== "production";

  return {
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? "lax" : "none",
    path: "/",
    domain: isLocal ? undefined : getCookieDomain(req),
    maxAge: 1000 * 60 * 60 * 24 * 7,
  } as const;
}
