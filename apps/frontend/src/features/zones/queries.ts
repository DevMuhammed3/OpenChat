import { queryOptions, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { ZoneMember, ZoneSummary } from "@/features/zones/types"

type ZonesResponse = {
  zones: ZoneSummary[]
}

type ZoneMembersResponse = {
  members: ZoneMember[]
}

export const zoneKeys = {
  all: ["zones"] as const,
  list: () => [...zoneKeys.all, "list"] as const,
  members: (zonePublicId: string) => [...zoneKeys.all, zonePublicId, "members"] as const,
}

export function getZonesQueryOptions() {
  return queryOptions({
    queryKey: zoneKeys.list(),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<ZonesResponse>("/zones")
      return data.zones ?? []
    },
  })
}

export function useZones() {
  return useQuery(getZonesQueryOptions())
}

export function useZone(zonePublicId?: string) {
  return useQuery({
    ...getZonesQueryOptions(),
    enabled: Boolean(zonePublicId),
    select: (zones) => zones.find((zone) => zone.publicId === zonePublicId) ?? null,
  })
}

export function getZoneMembersQueryOptions(zonePublicId: string) {
  return queryOptions({
    queryKey: zoneKeys.members(zonePublicId),
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<ZoneMembersResponse>(`/zones/${zonePublicId}/members`)
      return data.members ?? []
    },
  })
}

export function useZoneMembers(zonePublicId?: string, enabled = true) {
  return useQuery({
    queryKey: zonePublicId ? zoneKeys.members(zonePublicId) : [...zoneKeys.all, "members", "idle"],
    queryFn: async () => {
      if (!zonePublicId) {
        return [] as ZoneMember[]
      }

      const data = await apiClient.get<ZoneMembersResponse>(`/zones/${zonePublicId}/members`)
      return data.members ?? []
    },
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    enabled: Boolean(zonePublicId) && enabled,
  })
}
