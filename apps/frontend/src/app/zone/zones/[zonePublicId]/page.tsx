'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@openchat/lib"
import { Hash, Volume2 } from "lucide-react"

type Channel = {
  publicId: string
  name: string
  type: "TEXT" | "VOICE"
}

type Zone = {
  publicId: string
  name: string
}

export default function ZonePage() {
  const { zonePublicId } = useParams<{ zonePublicId: string }>()
  const [zone, setZone] = useState<Zone | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!zonePublicId) return

    let cancelled = false

    const loadZone = async () => {
      try {
        const [zonesRes, channelsRes] = await Promise.all([
          api("/zones"),
          api(`/zones/${zonePublicId}/channels`),
        ])

        const [zonesData, channelsData] = await Promise.all([
          zonesRes.json().catch(() => ({ zones: [] })),
          channelsRes.json().catch(() => ({ channels: [] })),
        ])

        if (cancelled) return

        setZone((zonesData.zones ?? []).find((entry: Zone) => entry.publicId === zonePublicId) ?? null)
        setChannels(channelsData.channels ?? [])
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load zone view", err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadZone()

    return () => {
      cancelled = true
    }
  }, [zonePublicId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1220]">
        <div className="animate-pulse font-medium text-zinc-500">Loading zone...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[100svh] items-center justify-center bg-[#0b1220] p-6">
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
