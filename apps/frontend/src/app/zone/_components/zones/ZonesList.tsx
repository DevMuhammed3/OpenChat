"use client"

import { Plus, Home } from "lucide-react"
import { Button, Skeleton } from "packages/ui"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api, getAvatarUrl, cn } from "@openchat/lib"
import { CreateZoneModal } from "./CreateZoneModal"

type Zone = {
  publicId: string
  name: string
  avatar: string | null
}

export default function ZonesList() {
  const router = useRouter()
  const { zonePublicId } = useParams<{ zonePublicId?: string }>()

  const [zones, setZones] = useState<Zone[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadZones = async () => {
      try {
        setLoading(true)
        const res = await api("/zones")
        const data = await res.json()
        setZones(data.zones ?? [])
      } catch (err) {
        console.error("Failed to fetch zones", err)
      } finally {
        setLoading(false)
      }
    }

    loadZones()
  }, [])


  const createZone = async (name: string, avatar?: File | null) => {
    if (!name.trim()) return

    const form = new FormData()
    form.append("name", name)

    if (avatar) {
      form.append("avatar", avatar)
    }

    const res = await api("/zones", {
      method: "POST",
      body: form
    })

    const data = await res.json()
    const zone = data.zone

    if (!zone?.publicId) return

    setZones(prev => [
      ...prev,
      {
        publicId: zone.publicId,
        name: zone.name,
        avatar: zone.avatar ?? null
      }
    ])

    router.push(`/zone/zones/${zone.publicId}`)
  }
  return (
    <div className="w-[72px] bg-background border-r border-white/5 flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto no-scrollbar">
      <Button
        onClick={() => { router.push("/zone") }}
        className={cn(
          "w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden p-0 group relative",
          !zonePublicId ? "bg-primary text-white" : "bg-muted text-zinc-400 hover:bg-primary hover:text-white"
        )}
      >
        <div className={cn(
          "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200",
          !zonePublicId ? "h-10" : "h-5 group-hover:h-5 opacity-0 group-hover:opacity-100"
        )} />
        <Home size={22} />
      </Button>

      <div className="w-8 h-[2px] bg-white/10 rounded-full mx-auto my-1" />

      {/* Zones */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-12 h-12 rounded-[24px]" />
          ))}
        </div>
      ) : (
        zones.map(zone => {
          const active = zonePublicId === zone.publicId

          return (
            <div key={zone.publicId} className="relative group flex items-center justify-center w-full">
              <div className={cn(
                "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200",
                active ? "h-10" : "h-5 opacity-0 group-hover:opacity-100"
              )} />
              
              <Button
                title={zone.name}
                onClick={() => router.push(`/zone/zones/${zone.publicId}`)}
                className={cn(
                  "w-12 h-12 transition-all duration-200 flex items-center justify-center overflow-hidden p-0",
                  active ? "rounded-[16px] bg-primary text-white" : "rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-primary text-zinc-400 hover:text-white"
                )}
              >
                {zone.avatar ? (
                  <img
                    src={getAvatarUrl(zone.avatar)}
                    alt={zone.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold uppercase">{zone.name?.[0]}</span>
                )}
              </Button>
            </div>
          )
        })
      )}

      <div className="w-8 h-[2px] bg-white/10 rounded-full mx-auto my-1" />
      
      <Button
        onClick={() => setOpen(true)}
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-muted hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all duration-200 flex items-center justify-center group"
      >
        <Plus size={22} />
      </Button>

      <CreateZoneModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createZone}
      />
    </div>
  )
}
