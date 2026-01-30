const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL!;

if (!RAW_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export const API_URL = RAW_API_URL.replace(/\/+$/, "");

export function api(path: string, options?: RequestInit) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${API_URL}${cleanPath}`, {
    credentials: "include",
    ...options,
  });
}

