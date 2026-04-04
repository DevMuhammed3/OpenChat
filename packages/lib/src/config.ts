const DEFAULT_API_URL = "https://api.0zone.site";

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function normalizeAndValidateApiUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return normalizeUrl(url.toString());
  } catch {
    return null;
  }
}

export function getApiBaseUrl() {
  const runtimeUrl = normalizeAndValidateApiUrl((globalThis as any)?.openchatConfig?.apiUrl);
  if (runtimeUrl) return runtimeUrl;

  const envUrl = normalizeAndValidateApiUrl(
    typeof process !== "undefined"
      ? process.env.OPENCHAT_API_URL || process.env.NEXT_PUBLIC_API_URL
      : undefined,
  );
  if (envUrl) return envUrl;

  return DEFAULT_API_URL;
}

export { DEFAULT_API_URL };
