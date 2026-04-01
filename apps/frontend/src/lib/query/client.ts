import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api/client"

const DEFAULT_STALE_TIME = 30_000
const DEFAULT_GC_TIME = 30 * 60_000

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
          if (error instanceof ApiError && error.status < 500) {
            return false
          }

          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
