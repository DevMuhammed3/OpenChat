'use client'

import { useState } from 'react'
import { Button } from 'packages/ui'
import { Hash, Plus, Volume2 } from 'lucide-react'
import { cn, getAvatarUrl } from '@openchat/lib'
import { CreateZoneModal } from '../_components/zones/CreateZoneModal'
import { useChannels } from '@/features/channels/queries'
import { useZoneNavigation } from '@/features/channels/navigation'
import { useCoarsePointer, usePrefetchOnVisible } from '@/features/prefetch/usePrefetchOnVisible'
import { useCreateZoneMutation } from '@/features/zones/mutations'
import { useZones } from '@/features/zones/queries'
import type { ZoneSummary } from '@/features/zones/types'

export default function ZonesHubPage() {
  const { data: zones = [], isLoading } = useZones()
  const createZoneMutation = useCreateZoneMutation()
  const { openZone } = useZoneNavigation()
  const [open, setOpen] = useState(false)
  const [lastZonePublicId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('openchat:last-zone-public-id'),
  )

  const createZone = async (name: string, avatar?: File | null) => {
    if (!name.trim()) return

    const zone = await createZoneMutation.mutateAsync({ name, avatar })
    await openZone(zone.publicId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="shrink-0 border-b border-white/5 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Spaces</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Your zones</h1>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-2xl bg-primary px-4 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </div>
        <p className="text-sm text-zinc-400">
          Jump into any zone fast, or create a new one here.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
              <Hash className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">No zones yet</h2>
            <p className="mt-2 max-w-xs text-sm text-zinc-400">
              Create your first zone and keep your chats and channels in one place.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-6 rounded-2xl px-5">
              <Plus className="mr-1 h-4 w-4" />
              Create your first zone
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone, index) => (
              <ZoneCard
                key={zone.publicId}
                index={index}
                isRecent={lastZonePublicId === zone.publicId}
                zone={zone}
              />
            ))}
          </div>
        )}
      </div>

      <CreateZoneModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createZone}
      />
    </div>
  )
}

function ZoneCard({
  index,
  isRecent,
  zone,
}: {
  index: number
  isRecent: boolean
  zone: ZoneSummary
}) {
  const isCoarsePointer = useCoarsePointer()
  const { prefetchZone, openZone } = useZoneNavigation()
  const previewEnabled = isRecent || index < 2
  const { data: zoneChannels = [] } = useChannels(zone.publicId, previewEnabled)
  const visiblePrefetchRef = usePrefetchOnVisible<HTMLButtonElement>(
    () => prefetchZone(zone.publicId),
    { enabled: isCoarsePointer },
  )

  const textChannels = zoneChannels.filter((channel) => channel.type === 'TEXT')
  const voiceChannels = zoneChannels.filter((channel) => channel.type === 'VOICE')

  return (
    <button
      ref={visiblePrefetchRef}
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
        'w-full rounded-[28px] border px-4 py-4 text-left transition-all active:scale-[0.99]',
        isRecent
          ? 'border-primary/30 bg-primary/10 shadow-[0_20px_50px_rgba(124,58,237,0.16)]'
          : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.05]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[20px] bg-gradient-to-br from-primary to-cyan-500">
          {zone.avatar ? (
            <img
              src={getAvatarUrl(zone.avatar)}
              alt={zone.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-black text-white">
              {zone.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-white">{zone.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {zoneChannels.length > 0
                  ? `${textChannels.length} text • ${voiceChannels.length} voice`
                  : 'Hover or tap to warm this zone'}
              </p>
            </div>
            {isRecent && (
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Recent
              </span>
            )}
          </div>

          {zoneChannels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {zoneChannels.slice(0, 3).map((channel) => (
                <span
                  key={channel.publicId}
                  className="inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-300"
                >
                  {channel.type === 'TEXT' ? <Hash className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {channel.name}
                </span>
              ))}
              {zoneChannels.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400">
                  +{zoneChannels.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
