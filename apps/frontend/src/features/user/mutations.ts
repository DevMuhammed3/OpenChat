import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { userKeys } from "@/features/user/queries"
import type { AppUser } from "@/features/user/types"

type UserResponse = {
  user: AppUser
}

function syncCurrentUser(queryClient: QueryClient, user: AppUser) {
  queryClient.setQueryData(userKeys.current(), user)
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name?: string | null
      username?: string
      bio?: string | null
    }) => {
      const data = await apiClient.patch<UserResponse>("/users/profile", input)
      return data.user
    },
    onSuccess(user) {
      syncCurrentUser(queryClient, user)
    },
  })
}

export function useUpdateAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (avatar: File) => {
      const formData = new FormData()
      formData.append("avatar", avatar)
      const data = await apiClient.patch<UserResponse>("/users/avatar", formData)
      return data.user
    },
    onSuccess(user) {
      syncCurrentUser(queryClient, user)
    },
  })
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const data = await apiClient.delete<UserResponse>("/users/avatar")
      return data.user
    },
    onSuccess(user) {
      syncCurrentUser(queryClient, user)
    },
  })
}
