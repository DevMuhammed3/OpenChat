export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  try {
    const { hostname } = new URL(origin);

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".qzz.io") ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".trycloudflare.com")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

