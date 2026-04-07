"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Grid3X3, Plus, Hash, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "packages/ui"
import { useZones } from "@/features/zones/queries"
import { useZoneNavigation } from "@/features/channels/navigation"
import { cn } from "@openchat/lib"

interface DMSidebarDropdownProps {
  children?: React.ReactNode
}

export function DMSidebarDropdown({ children }: DMSidebarDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: zones = [] } = useZones()
  const { openZone } = useZoneNavigation()

  const recentZones = zones.slice(0, 5)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleZoneClick = (zonePublicId: string) => {
    setIsOpen(false)
    void openZone(zonePublicId)
  }

  const handleViewAllZones = () => {
    setIsOpen(false)
    router.push("/zone/zones")
  }

  const handleCreateZone = () => {
    setIsOpen(false)
    router.push("/zone/zones?open-create=true")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        {children || (
          <h2 className="font-bold text-white text-[15px] truncate text-left flex-1 leading-tight">
            Direct Messages
          </h2>
        )}
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181b] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={handleViewAllZones}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Grid3X3 className="w-4 h-4 text-zinc-400" />
                <span>View All Zones</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button
              onClick={handleCreateZone}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
              <span>Create New Zone</span>
            </button>
          </div>

          {recentZones.length > 0 && (
            <>
              <div className="border-t border-white/10" />
              <div className="py-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Recent Zones
                </p>
                {recentZones.map((zone) => (
                  <button
                    key={zone.publicId}
                    onClick={() => handleZoneClick(zone.publicId)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Avatar className="h-5 w-5 rounded-md">
                      <AvatarImage src={zone.avatar ?? undefined} />
                      <AvatarFallback className="bg-[hsl(var(--primary))] text-white text-[10px]">
                        {zone.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{zone.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}