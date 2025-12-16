const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL!;

export const API_URL = RAW_API_URL.replace(/\/+$/, "");

export function api(path: string, options?: RequestInit) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${API_URL}${cleanPath}`, {
    credentials: "include",
    ...options,
  });
}

