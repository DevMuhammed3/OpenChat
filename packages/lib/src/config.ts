const DEFAULT_API_URL = "https://api.openchat.qzz.io";

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const runtimeUrl = (globalThis as any)?.openchatConfig?.apiUrl;
  if (typeof runtimeUrl === "string" && runtimeUrl.trim()) {
    return normalizeUrl(runtimeUrl);
  }

  const envUrl =
    (typeof process !== "undefined"
      ? process.env.OPENCHAT_API_URL || process.env.NEXT_PUBLIC_API_URL
      : undefined) || DEFAULT_API_URL;

  return normalizeUrl(envUrl);
}

export { DEFAULT_API_URL };

