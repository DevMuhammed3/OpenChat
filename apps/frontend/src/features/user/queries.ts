import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, apiClient } from "@/lib/api/client"
import type { AppUser } from "@/features/user/types"

type CurrentUserResponse = {
  user: AppUser | null
}

export const userKeys = {
  all: ["user"] as const,
  current: () => [...userKeys.all, "current"] as const,
}

export function getCurrentUserQueryOptions() {
  return queryOptions({
    queryKey: userKeys.current(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      try {
        const data = await apiClient.get<CurrentUserResponse>("/auth/me", {
          cache: "no-store",
        })

        return data.user ?? null
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null
        }

        throw error
      }
    },
  })
}

export function useUser() {
  return useQuery(getCurrentUserQueryOptions())
}

export function useCurrentUserCache() {
  const queryClient = useQueryClient()

  return {
    setUser(user: AppUser | null) {
      queryClient.setQueryData(userKeys.current(), user)
    },
  }
}
