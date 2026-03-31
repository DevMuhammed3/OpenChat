'use client'

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Hash, Volume2 } from "lucide-react"
import { buildChannelRoute } from "@/features/channels/navigation"
import { getPrimaryTextChannel, useChannels } from "@/features/channels/queries"
import { useZone } from "@/features/zones/queries"

export default function ZonePage() {
  const { zonePublicId } = useParams<{ zonePublicId: string }>()
  const router = useRouter()
  const { data: zone, isLoading: zoneLoading } = useZone(zonePublicId)
  const { data: channels = [], isLoading: channelsLoading } = useChannels(zonePublicId)

  useEffect(() => {
    const primaryChannel = getPrimaryTextChannel(channels)

    if (!primaryChannel) {
      return
    }

    router.replace(buildChannelRoute(zonePublicId, primaryChannel.publicId))
  }, [channels, router, zonePublicId])

  if (zoneLoading || channelsLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-background">
        <div className="animate-pulse font-medium text-zinc-500">Loading zone...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Zone Overview</p>
        <h1 className="mb-3 text-3xl font-bold text-white">{zone?.name ?? "Zone"}</h1>
        <p className="mb-8 text-sm text-zinc-400">
          You&apos;re in the zone. Pick a text or voice channel from the sidebar to join.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <div
              key={channel.publicId}
              className="rounded-2xl border border-white/8 bg-black/20 p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-zinc-300">
                {channel.type === "TEXT" ? <Hash className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span className="font-medium">{channel.name}</span>
              </div>
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                {channel.type === "TEXT" ? "Text Channel" : "Voice Channel"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
