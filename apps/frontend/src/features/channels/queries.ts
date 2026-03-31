import { queryOptions, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { ZoneChannel, ZoneVoicePresence } from "@/features/channels/types"

type ChannelsResponse = {
  channels: ZoneChannel[]
}

type VoicePresenceResponse = {
  channels: ZoneVoicePresence[]
}

export const channelKeys = {
  all: ["channels"] as const,
  list: (zonePublicId: string) => ["zones", zonePublicId, "channels"] as const,
  detail: (zonePublicId: string, channelPublicId: string) =>
    ["zones", zonePublicId, "channels", channelPublicId] as const,
  voicePresence: (zonePublicId: string) => ["zones", zonePublicId, "voice-presence"] as const,
}

export function getChannelsQueryOptions(zonePublicId: string) {
  return queryOptions({
    queryKey: channelKeys.list(zonePublicId),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<ChannelsResponse>(`/zones/${zonePublicId}/channels`)
      return data.channels ?? []
    },
  })
}

export function useChannels(zonePublicId?: string, enabled = true) {
  return useQuery<ZoneChannel[]>({
    queryKey: zonePublicId ? channelKeys.list(zonePublicId) : [...channelKeys.all, "idle"],
    queryFn: async () => {
      if (!zonePublicId) {
        return []
      }

      const data = await apiClient.get<ChannelsResponse>(`/zones/${zonePublicId}/channels`)
      return data.channels ?? []
    },
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    enabled: Boolean(zonePublicId) && enabled,
  })
}

export function useChannel(zonePublicId?: string, channelPublicId?: string, enabled = true) {
  return useQuery<ZoneChannel[], Error, ZoneChannel | null>({
    queryKey: zonePublicId ? channelKeys.list(zonePublicId) : [...channelKeys.all, "detail", "idle"],
    queryFn: async () => {
      if (!zonePublicId) {
        return []
      }

      const data = await apiClient.get<ChannelsResponse>(`/zones/${zonePublicId}/channels`)
      return data.channels ?? []
    },
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    enabled: Boolean(zonePublicId && channelPublicId) && enabled,
    select: (channels) => channels.find((channel) => channel.publicId === channelPublicId) ?? null,
  })
}

export function getZoneVoicePresenceQueryOptions(zonePublicId: string) {
  return queryOptions({
    queryKey: channelKeys.voicePresence(zonePublicId),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<VoicePresenceResponse>(`/zones/${zonePublicId}/voice-presence`)
      return data.channels ?? []
    },
  })
}

export function useZoneVoicePresence(zonePublicId?: string, enabled = true) {
  return useQuery<ZoneVoicePresence[]>({
    queryKey: zonePublicId ? channelKeys.voicePresence(zonePublicId) : [...channelKeys.all, "voice-presence", "idle"],
    queryFn: async () => {
      if (!zonePublicId) {
        return []
      }

      const data = await apiClient.get<VoicePresenceResponse>(`/zones/${zonePublicId}/voice-presence`)
      return data.channels ?? []
    },
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    enabled: Boolean(zonePublicId) && enabled,
  })
}

export function getPrimaryTextChannel(channels: ZoneChannel[]) {
  return channels.find((channel) => channel.type === "TEXT") ?? null
}
