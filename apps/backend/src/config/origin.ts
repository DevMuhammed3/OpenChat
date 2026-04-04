export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  try {
    const { hostname } = new URL(origin);

    const configuredAllowlist = process.env.OPENCHAT_ALLOWED_ORIGINS?.trim();
    if (configuredAllowlist) {
      const entries = configuredAllowlist
        .split(/[,\s]+/g)
        .map((v) => v.trim())
        .filter(Boolean);

      const exactHostnames: string[] = [];
      const suffixHostnames: string[] = [];

      for (const entry of entries) {
        let host = entry;
        try {
          host = new URL(entry).hostname;
        } catch {
          // Allow passing raw hostnames like "example.com" or patterns like "*.example.com".
        }

        host = host.trim().toLowerCase();
        if (!host) continue;

        if (host.startsWith("*.") || host.startsWith(".")) {
          suffixHostnames.push(host.replace(/^\*\./, "."));
        } else {
          exactHostnames.push(host.replace(/^\./, ""));
        }
      }

      const lowerHostname = hostname.toLowerCase();
      if (exactHostnames.includes(lowerHostname)) return true;
      if (suffixHostnames.some((suffix) => lowerHostname.endsWith(suffix))) return true;
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0zone.site" ||
      hostname === "www.0zone.site" ||
      hostname.endsWith(".0zone.site") ||
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
