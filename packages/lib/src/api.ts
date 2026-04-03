import { getApiBaseUrl } from "./config";

export function api(path: string, options?: RequestInit) {
  const apiUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${apiUrl}${cleanPath}`, {
    credentials: "include",
    ...options,
  });
}
