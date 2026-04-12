'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button, Input } from 'packages/ui'
import { Hash, Plus, Volume2, Search, X } from 'lucide-react'
import { cn, getAvatarUrl } from '@openchat/lib'
import { CreateZoneModal } from '../_components/zones/CreateZoneModal'
import { useChannels } from '@/features/channels/queries'
import { useZoneNavigation } from '@/features/channels/navigation'
import { usePrefetchOnVisible } from '@/features/prefetch/usePrefetchOnVisible'
import { useCreateZoneMutation } from '@/features/zones/mutations'
import { useZones } from '@/features/zones/queries'
import type { ZoneSummary } from '@/features/zones/types'

export default function ZonesHubPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: zones = [], isLoading } = useZones()
  const createZoneMutation = useCreateZoneMutation()
  const { openZone } = useZoneNavigation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [lastZonePublicId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('openchat:last-zone-public-id'),
  )

  useEffect(() => {
    if (searchParams.get('open-create') === 'true') {
      setShowCreateModal(true)
      router.replace('/zone/zones')
    }
  }, [searchParams, router])

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones
    const query = searchQuery.toLowerCase()
    return zones.filter((zone) => zone.name.toLowerCase().includes(query))
  }, [zones, searchQuery])

  const createZone = async (name: string, avatar?: File | null) => {
    if (!name.trim()) return

    const zone = await createZoneMutation.mutateAsync({ name, avatar })
    await openZone(zone.publicId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-main">
      <div className="shrink-0 px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Spaces</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Your zones</h1>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 rounded-2xl bg-primary px-4 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zones..."
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-surface border border-white/10 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl border border-white/5 bg-surface" />
            ))}
          </div>
        ) : filteredZones.length === 0 ? (
          zones.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-surface px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                <Hash className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-foreground">No zones yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Create your first zone and keep your chats and channels in one place.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-6 rounded-2xl px-5">
                <Plus className="mr-1 h-4 w-4" />
                Create your first zone
              </Button>
            </div>
          ) : (
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-lg font-bold text-foreground">No results found</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                No zones matching "{searchQuery}"
              </p>
              <Button 
                variant="ghost" 
                onClick={() => setSearchQuery('')} 
                className="mt-4 text-primary"
              >
                Clear search
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filteredZones.map((zone, index) => (
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
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
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
  const { prefetchZone, openZone } = useZoneNavigation()
  const previewEnabled = isRecent || index < 2
  const { data: zoneChannels = [] } = useChannels(zone.publicId, previewEnabled)
  const visiblePrefetchRef = usePrefetchOnVisible<HTMLButtonElement>(
    () => prefetchZone(zone.publicId),
    { enabled: true },
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
        void prefetchZone(zone.publicId)
      }}
      className={cn(
        'w-full rounded-[28px] border px-4 py-4 text-left transition-all active:scale-[0.99]',
        isRecent
          ? 'border-primary/30 bg-primary/10 shadow-[0_20px_50px_rgba(124,58,237,0.16)]'
          : 'border-white/6 bg-surface hover:bg-white/[0.05]'
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
              <h2 className="truncate text-base font-bold text-foreground">{zone.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
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