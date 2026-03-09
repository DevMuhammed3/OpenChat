"use client"

// import ZonesList from "../../_components/zones/ZonesList"
// import ZoneSidebar from "../../_components/ZoneSidebar"
import { useParams } from "next/navigation"

export default function ZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { zonePublicId } = useParams<{ zonePublicId: string }>()

  return (
    <div className="flex h-screen w-full">

      {/* Zones bar */}

      {/* Channels sidebar */}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

    </div>
  )
}
