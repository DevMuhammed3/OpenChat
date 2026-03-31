"use client"

import { startTransition } from "react"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { getMessagesQueryOptions } from "@/features/chat/queries"
import { getChannelsQueryOptions, getPrimaryTextChannel } from "@/features/channels/queries"

export function buildZoneRoute(zonePublicId: string) {
  return `/zone/zones/${zonePublicId}`
}

export function buildChannelRoute(zonePublicId: string, channelPublicId: string) {
  return `/zone/zones/${zonePublicId}/channels/${channelPublicId}`
}

export async function prefetchZoneTarget(
  queryClient: QueryClient,
  router: AppRouterInstance,
  zonePublicId: string,
) {
  const channels = await queryClient.ensureQueryData(getChannelsQueryOptions(zonePublicId))
  const primaryChannel = getPrimaryTextChannel(channels)
  const target = primaryChannel
    ? buildChannelRoute(zonePublicId, primaryChannel.publicId)
    : buildZoneRoute(zonePublicId)

  router.prefetch(target)

  if (primaryChannel) {
    void queryClient.prefetchQuery(getMessagesQueryOptions(zonePublicId, primaryChannel.publicId))
  }

  return { primaryChannel, target }
}

export async function prefetchChannelTarget(
  queryClient: QueryClient,
  router: AppRouterInstance,
  zonePublicId: string,
  channelPublicId: string,
) {
  const target = buildChannelRoute(zonePublicId, channelPublicId)

  router.prefetch(target)
  await Promise.all([
    queryClient.ensureQueryData(getChannelsQueryOptions(zonePublicId)),
    queryClient.prefetchQuery(getMessagesQueryOptions(zonePublicId, channelPublicId)),
  ])

  return target
}

export function useZoneNavigation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return {
    async prefetchZone(zonePublicId: string) {
      return prefetchZoneTarget(queryClient, router, zonePublicId)
    },
    async openZone(zonePublicId: string) {
      const { target } = await prefetchZoneTarget(queryClient, router, zonePublicId)

      startTransition(() => {
        router.push(target)
      })
    },
    async prefetchChannel(zonePublicId: string, channelPublicId: string) {
      return prefetchChannelTarget(queryClient, router, zonePublicId, channelPublicId)
    },
    async openChannel(zonePublicId: string, channelPublicId: string) {
      const target = await prefetchChannelTarget(queryClient, router, zonePublicId, channelPublicId)

      startTransition(() => {
        router.push(target)
      })
    },
  }
}
