"use client"

import { Home, Plus } from "lucide-react"
import { Button, Skeleton } from "packages/ui"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { cn, getAvatarUrl } from "@openchat/lib"
import { CreateZoneModal } from "./CreateZoneModal"
import { useZoneNavigation } from "@/features/channels/navigation"
import { useCoarsePointer, usePrefetchOnVisible } from "@/features/prefetch/usePrefetchOnVisible"
import { useCreateZoneMutation } from "@/features/zones/mutations"
import { useZones } from "@/features/zones/queries"
import type { ZoneSummary } from "@/features/zones/types"

export default function ZonesList() {
  const router = useRouter()
  const { zonePublicId } = useParams<{ zonePublicId?: string }>()
  const { data: zones = [], isLoading } = useZones()
  const createZoneMutation = useCreateZoneMutation()
  const { openZone } = useZoneNavigation()
  const [open, setOpen] = useState(false)

  const createZone = async (name: string, avatar?: File | null) => {
    if (!name.trim()) return

    const zone = await createZoneMutation.mutateAsync({ name, avatar })
    await openZone(zone.publicId)
  }

  return (
    <div className="w-[72px] bg-background border-r border-white/5 flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto no-scrollbar">
      <div className="relative group flex items-center justify-center w-full">
        <div className={cn(
          "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200",
          !zonePublicId
            ? "h-10 hover:rounded-[16px] focus-visible:rounded-[16px] bg-primary opacity-100"
            : "h-5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )} />

        <Button
          onClick={() => { router.push("/zone") }}
          className={cn(
            "w-12 h-12 rounded-[24px] hover:rounded-[16px] focus-visible:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden p-0",
            !zonePublicId ? "bg-primary text-white" : "bg-muted text-zinc-400 hover:bg-primary hover:text-white"
          )}
        >
          <Home size={22} />
        </Button>
      </div>

      <div className="w-8 h-[2px] bg-white/10 rounded-full mx-auto my-1" />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="w-12 h-12 rounded-[24px]" />
          ))}
        </div>
      ) : (
        zones.map((zone) => (
          <ZoneListItem
            key={zone.publicId}
            active={zonePublicId === zone.publicId}
            zone={zone}
          />
        ))
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

function ZoneListItem({
  active,
  zone,
}: {
  active: boolean
  zone: ZoneSummary
}) {
  const isCoarsePointer = useCoarsePointer()
  const { openZone, prefetchZone } = useZoneNavigation()
  const prefetchRef = usePrefetchOnVisible<HTMLDivElement>(() => prefetchZone(zone.publicId), {
    enabled: isCoarsePointer,
  })

  return (
    <div ref={prefetchRef} className="relative group flex items-center justify-center w-full">
      <div className={cn(
        "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200",
        active ? "h-10" : "h-5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      )} />

      <Button
        title={zone.name}
        onClick={() => {
          void openZone(zone.publicId)
        }}
        onPointerEnter={() => {
          if (!isCoarsePointer) {
            void prefetchZone(zone.publicId)
          }
        }}
        onTouchStart={() => {
          void prefetchZone(zone.publicId)
        }}
        className={cn(
          "w-12 h-12 transition-all duration-200 flex items-center justify-center overflow-hidden p-0 focus-visible:rounded-[16px]",
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
}
