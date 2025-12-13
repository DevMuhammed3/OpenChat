export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  if (
    origin.includes("localhost") ||
    origin.endsWith(".qzz.io") ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".trycloudflare.com")
  ) {
    return true;
  }

  return false;
}
