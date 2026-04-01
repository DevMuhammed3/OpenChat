import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { channelKeys } from "@/features/channels/queries"
import { zoneKeys } from "@/features/zones/queries"
import type { ZoneInvite, ZoneMember, ZoneRole, ZoneSummary } from "@/features/zones/types"

type ZoneResponse = {
  zone: ZoneSummary
}

type ZoneInviteResponse = {
  invite: ZoneInvite
}

type SuccessResponse = {
  success: boolean
}

export function useCreateZoneMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      avatar,
    }: {
      name: string
      avatar?: File | null
    }) => {
      const formData = new FormData()
      formData.append("name", name)

      if (avatar) {
        formData.append("avatar", avatar)
      }

      const data = await apiClient.post<ZoneResponse>("/zones", formData)
      return data.zone
    },
    onSuccess(zone) {
      queryClient.setQueryData<ZoneSummary[]>(zoneKeys.list(), (current = []) => [
        zone,
        ...current.filter((item) => item.publicId !== zone.publicId),
      ])
      queryClient.removeQueries({ queryKey: channelKeys.list(zone.publicId) })
    },
  })
}

export function useUpdateZoneMutation(zonePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      avatar,
    }: {
      name?: string
      avatar?: File | null
    }) => {
      const formData = new FormData()

      if (name?.trim()) {
        formData.append("name", name.trim())
      }

      if (avatar) {
        formData.append("avatar", avatar)
      }

      const data = await apiClient.patch<ZoneResponse>(`/zones/${zonePublicId}`, formData)
      return data.zone
    },
    onSuccess(zone) {
      queryClient.setQueryData<ZoneSummary[]>(zoneKeys.list(), (current = []) =>
        current.map((item) => (item.publicId === zone.publicId ? { ...item, ...zone } : item)),
      )
    },
  })
}

export function useRemoveZoneMemberMutation(zonePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete<SuccessResponse>(`/zones/${zonePublicId}/members/${userId}`)
      return userId
    },
    onMutate(userId) {
      const previousMembers = queryClient.getQueryData<ZoneMember[]>(zoneKeys.members(zonePublicId))

      queryClient.setQueryData<ZoneMember[]>(zoneKeys.members(zonePublicId), (current = []) =>
        current.filter((member) => member.id !== userId),
      )

      return { previousMembers }
    },
    onError(_error, _userId, context) {
      if (context?.previousMembers) {
        queryClient.setQueryData(zoneKeys.members(zonePublicId), context.previousMembers)
      }
    },
  })
}

export function useUpdateZoneMemberRoleMutation(zonePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number
      role: Exclude<ZoneRole, "OWNER">
    }) => {
      await apiClient.patch<SuccessResponse>(`/zones/${zonePublicId}/members/${userId}/role`, {
        role,
      })

      return { userId, role }
    },
    onMutate({ userId, role }) {
      const previousMembers = queryClient.getQueryData<ZoneMember[]>(zoneKeys.members(zonePublicId))

      queryClient.setQueryData<ZoneMember[]>(zoneKeys.members(zonePublicId), (current = []) =>
        current.map((member) => (member.id === userId ? { ...member, role } : member)),
      )

      return { previousMembers }
    },
    onError(_error, _variables, context) {
      if (context?.previousMembers) {
        queryClient.setQueryData(zoneKeys.members(zonePublicId), context.previousMembers)
      }
    },
  })
}

export function useCreateZoneInviteMutation(zonePublicId: string) {
  return useMutation({
    mutationFn: async () => {
      const data = await apiClient.post<ZoneInviteResponse>(`/zones/${zonePublicId}/invites`)
      return data.invite
    },
  })
}

export function useJoinZoneMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      const data = await apiClient.post<ZoneResponse>(`/zones/invites/${code}/join`)
      return data.zone
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: zoneKeys.list() })
    },
  })
}

export function useLeaveZoneMutation(zonePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.post<SuccessResponse>(`/zones/${zonePublicId}/leave`)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: zoneKeys.list() })
      queryClient.removeQueries({ queryKey: channelKeys.list(zonePublicId) })
      queryClient.removeQueries({ queryKey: zoneKeys.members(zonePublicId) })
    },
  })
}
