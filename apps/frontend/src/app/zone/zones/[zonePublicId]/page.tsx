'use client'

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@openchat/lib"

export default function ZonePage() {
  const { zonePublicId } = useParams<{ zonePublicId: string }>()
  const router = useRouter()

  useEffect(() => {
    if (!zonePublicId) return

    const loadChannels = async () => {
      try {
        const res = await api(`/zones/${zonePublicId}/channels`)
        const data = await res.json()
        const channels = data.channels ?? []
        
        const firstTextChannel = channels.find((c: any) => c.type === 'TEXT') || channels[0]
        
        if (firstTextChannel) {
          router.replace(`/zone/zones/${zonePublicId}/channels/${firstTextChannel.publicId}`)
        }
      } catch (err) {
        console.error("Failed to load channel data", err)
      }
    }

    loadChannels()
  }, [zonePublicId, router])

  return (
    <div className="flex items-center justify-center h-screen bg-[#0b1220]">
      <div className="animate-pulse text-zinc-500 font-medium">Entering Zone...</div>
    </div>
  )
}
