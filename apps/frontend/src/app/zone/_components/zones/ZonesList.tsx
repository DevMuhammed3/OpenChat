"use client"

import { Plus, Home } from "lucide-react"
import { Button, Input } from "packages/ui"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@openchat/lib"
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

  useEffect(() => {
    const loadZones = async () => {
      try {
        const res = await api("/zones")
        const data = await res.json()
        setZones(data.zones ?? [])
      } catch (err) {
        console.error("Failed to fetch zones", err)
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
    <div className="w-16 bg-[#050912] border-r border-white/5 flex flex-col items-center py-3 gap-3">

      <Button
        onClick={() => { router.push("/zone") }}

        className="w-10 h-10 rounded-xl bg-[#111a2b] hover:bg-[#1b253b]"
      >
        <Home size={18} />
      </Button>

      {/* Create Zone Button */}


      <CreateZoneModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createZone}
      />

      <div className="w-8 h-[1px] bg-white/10" />

      {/* Zones */}

      {zones.map(zone => {
        const active = zonePublicId === zone.publicId

        return (
          <Button
            key={zone.publicId}
            title={zone.name}
            onClick={() => router.push(`/zone/zones/${zone.publicId}`)}
            className={`
              relative
              w-10 h-10
              rounded-xl
              flex items-center justify-center
              text-sm font-bold
              transition
              ${active
                ? "bg-primary text-primary-foreground"
                : "bg-[#111a2b] hover:bg-[#1b253b]"
              }
            `}
          >

            {active && (
              <div className="absolute -left-2 w-1 h-6 bg-white rounded-full" />
            )}

            {zone.avatar
              ? <img src={zone.avatar} className="w-6 h-6 rounded-full" />
              : zone.name?.[0]?.toUpperCase()
            }

          </Button>
        )
      })}

      <div className="w-8 h-[1px] bg-white/10" />
      <Button
        onClick={() => setOpen(true)}
        className="w-10 h-10 border-t rounded-xl bg-[#111a2b] hover:bg-[#1b253b]"
      >
        <Plus size={18} />
      </Button>

    </div>
  )
}


