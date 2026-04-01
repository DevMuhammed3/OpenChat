import { getAvatarUrl } from "@openchat/lib"

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL

if (!RAW_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined")
}

const API_URL = RAW_API_URL.replace(/\/+$/, "")

type PrimitiveQueryValue = string | number | boolean | null | undefined
type QueryValue = PrimitiveQueryValue | PrimitiveQueryValue[]

export type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | FormData | URLSearchParams | Record<string, unknown> | null
  query?: Record<string, QueryValue>
}

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

function appendQuery(searchParams: URLSearchParams, key: string, value: QueryValue) {
  if (Array.isArray(value)) {
    value.forEach((item) => appendQuery(searchParams, key, item))
    return
  }

  if (value === null || value === undefined) {
    return
  }

  searchParams.append(key, String(value))
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${API_URL}${cleanPath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => appendQuery(url.searchParams, key, value))
  }

  return url.toString()
}

function isSerializableJsonBody(body: ApiClientOptions["body"]) {
  if (!body) return false

  return !(
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  )
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  if (contentType.startsWith("text/")) {
    return response.text()
  }

  return response.arrayBuffer()
}

function normalizeErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.trim()) {
    return data
  }

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return fallback
}

export async function apiRequest<T>(path: string, options: ApiClientOptions = {}) {
  const { body, headers, query, ...requestInit } = options
  const nextHeaders = new Headers(headers)

  if (!nextHeaders.has("Accept")) {
    nextHeaders.set("Accept", "application/json")
  }

  let requestBody: BodyInit | null | undefined = body as BodyInit | null | undefined

  if (isSerializableJsonBody(body)) {
    requestBody = JSON.stringify(body)

    if (!nextHeaders.has("Content-Type")) {
      nextHeaders.set("Content-Type", "application/json")
    }
  }

  const response = await fetch(buildUrl(path, query), {
    credentials: "include",
    ...requestInit,
    headers: nextHeaders,
    body: requestBody,
  })

  const data = await parseResponse(response).catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      normalizeErrorMessage(data, `Request failed with status ${response.status}`),
      response.status,
      data,
    )
  }

  return data as T
}

export const apiClient = {
  request: apiRequest,
  get<T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) {
    return apiRequest<T>(path, options)
  },
  post<T>(path: string, body?: ApiClientOptions["body"], options?: Omit<ApiClientOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "POST", body })
  },
  patch<T>(path: string, body?: ApiClientOptions["body"], options?: Omit<ApiClientOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body })
  },
  put<T>(path: string, body?: ApiClientOptions["body"], options?: Omit<ApiClientOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "PUT", body })
  },
  delete<T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) {
    return apiRequest<T>(path, { ...options, method: "DELETE" })
  },
}

export { API_URL, getAvatarUrl }
