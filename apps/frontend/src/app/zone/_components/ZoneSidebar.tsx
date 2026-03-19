"use client"

import { useCallback, useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Hash, Volume2, Plus, Users, PhoneOff, Mic, MicOff } from 'lucide-react'
import { Button, ScrollArea, Skeleton } from 'packages/ui'
import { cn, api, socket } from '@openchat/lib'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import { CreateChannelModal } from './zones/CreateChannelModal'
import { type ChannelVoiceParticipant, useCallStore } from '@/app/stores/call-store'
import VoiceParticipants from './voice/VoiceParticipants'

type SidebarUser = {
  id: number
  username: string
  avatar?: string | null
}

type Zone = {
  publicId: string
  name: string
  avatar?: string | null
}

type Channel = {
  publicId: string
  name: string
  type: 'TEXT' | 'VOICE'
}

export default function ZoneSidebar({
  user,
}: {
  user: SidebarUser | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams<{ zonePublicId?: string; channelPublicId?: string }>()

  const zonePublicId = params?.zonePublicId
  const [channels, setChannels] = useState<Channel[]>([])
  const [zone, setZone] = useState<Zone | null>(null)
  const [voicePresence, setVoicePresence] = useState<Record<string, ChannelVoiceParticipant[]>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'TEXT' | 'VOICE'>('TEXT')

  const setChannelCall = useCallStore(s => s.setChannelCall)
  const activeChannelPublicId = useCallStore(s => s.channelPublicId)
  const channelParticipants = useCallStore(s => s.channelParticipants)
  const isMuted = useCallStore(s => s.isMuted)
  const toggleMuted = useCallStore(s => s.toggleMuted)

  const isHome = pathname.startsWith('/zone') && !zonePublicId
  const activeVoiceParticipants = activeChannelPublicId
    ? (voicePresence[activeChannelPublicId] ?? channelParticipants)
    : []

  const fetchChannels = useCallback(() => {
    if (!zonePublicId) {
      setChannels([])
      return
    }

    api(`/zones/${zonePublicId}/channels`)
      .then(res => res.json())
      .then(data => {
        setChannels(data.channels ?? [])
      })
  }, [zonePublicId])

  useEffect(() => {
    if (zonePublicId) {
      // Load zone details and channels
      api(`/zones`).then(res => res.json()).then(data => {
        const current = data.zones?.find((z: Zone) => z.publicId === zonePublicId)
        setZone(current)
      })

      api(`/zones/${zonePublicId}/channels`).then(res => res.json()).then(data => {
        setChannels(data.channels ?? [])
      })
    }
  }, [zonePublicId])

  useEffect(() => {
    if (!zonePublicId) return

    const handleChannelsUpdated = async (payload: { chatPublicId: string }) => {
      if (payload.chatPublicId !== zonePublicId) return
      fetchChannels()
    }

    const handleVoicePresence = (payload: {
      chatPublicId: string
      channelPublicId: string
      participants: ChannelVoiceParticipant[]
    }) => {
      if (payload.chatPublicId !== zonePublicId) return

      setVoicePresence((prev) => ({
        ...prev,
        [payload.channelPublicId]: payload.participants ?? [],
      }))
    }

    const handleZoneUpdated = (payload: { zone: Zone }) => {
      if (payload.zone.publicId !== zonePublicId) return
      setZone(payload.zone)
    }

    socket.on('zone:channels-updated', handleChannelsUpdated)
    socket.on('zone:voice-presence', handleVoicePresence)
    socket.on('zone:updated', handleZoneUpdated)

    return () => {
      socket.off('zone:channels-updated', handleChannelsUpdated)
      socket.off('zone:voice-presence', handleVoicePresence)
      socket.off('zone:updated', handleZoneUpdated)
    }
  }, [fetchChannels, zonePublicId])

  useEffect(() => {
    if (!zonePublicId) return

    let cancelled = false

    const loadVoicePresence = async () => {
      try {
        const res = await api(`/zones/${zonePublicId}/voice-presence`)
        const data = await res.json()
        if (cancelled) return

        const nextPresence = Object.fromEntries(
          (data.channels ?? []).map((channel: { channelPublicId: string; participants: ChannelVoiceParticipant[] }) => [
            channel.channelPublicId,
            channel.participants ?? [],
          ]),
        )

        setVoicePresence(nextPresence)
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load voice presence", err)
        }
      }
    }

    void loadVoicePresence()
    const interval = window.setInterval(loadVoicePresence, 5000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [zonePublicId])

  const handleCreateChannel = async (name: string, type: 'TEXT' | 'VOICE') => {
    try {
      const res = await api(`/zones/${zonePublicId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type })
      })
      if (res.ok) {
        fetchChannels()
      }
    } catch (err) {
      console.error("Failed to create channel", err)
    }
  }

  return (
    <div className="w-64 h-full border-r border-white/5 bg-background flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 border-b border-white/5 flex items-center shadow-sm">
        <h2 className="font-bold text-sm truncate">
          {zonePublicId ? (zone?.name || <Skeleton className="h-4 w-24" />) : 'Direct Messages'}
        </h2>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {isHome ? (
          <>
            <div className="p-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/zone')}
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === '/zone' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                )}
              >
                <Users className="h-4 w-4" />
                Friends
              </Button>
            </div>


            <div className="flex-1 overflow-y-auto">
              <ChatList />
            </div>
          </>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-4">
              {/* Text Channels */}
              <div>
                <div className="px-2 py-1 flex items-center justify-between group">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Text Channels
                  </p>
                  <Plus
                    className="w-3 h-3 text-zinc-500 cursor-pointer hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition"
                    onClick={() => { setModalType('TEXT'); setIsModalOpen(true); }}
                  />
                </div>
                <div className="space-y-0.5 mt-1">
                  {channels.filter(c => c.type === 'TEXT').map(channel => (
                    <Button
                      key={channel.publicId}
                      variant="ghost"
                      onClick={() => router.push(`/zone/zones/${zonePublicId}/channels/${channel.publicId}`)}
                      className={cn(
                        'w-full justify-start gap-2 px-2 py-1.5 h-auto rounded-md text-sm font-medium transition-colors',
                        params.channelPublicId === channel.publicId
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      )}
                    >
                      <Hash className="h-4 w-4 text-zinc-500" />
                      {channel.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Voice Channels */}
              <div>
                <div className="px-2 py-1 flex items-center justify-between group">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Voice Channels
                  </p>
                  <Plus
                    className="w-3 h-3 text-zinc-500 cursor-pointer hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition"
                    onClick={() => { setModalType('VOICE'); setIsModalOpen(true); }}
                  />
                </div>
                <div className="space-y-0.5 mt-1">
                  {channels.filter(c => c.type === 'VOICE').map(channel => {
                    const participants = voicePresence[channel.publicId] ?? []

                    return (
                      <div key={channel.publicId} className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => setChannelCall(channel.publicId)}
                        className={cn(
                          "w-full justify-start gap-2 px-2 py-1.5 h-auto rounded-md text-sm font-medium transition-colors",
                          activeChannelPublicId === channel.publicId 
                            ? "bg-white/10 text-white" 
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        )}
                      >
                        <Volume2 className="h-4 w-4 text-zinc-500" />
                        {channel.name}
                      </Button>
                      {(participants.length > 0 || activeChannelPublicId === channel.publicId) && (
                        <VoiceParticipants participants={participants.length > 0 ? participants : channelParticipants} />
                      )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Voice Status Bar */}
      {activeChannelPublicId && (
        <div className="mx-2 mb-2 p-2 bg-[#1b253b] rounded-lg flex items-center justify-between shadow-lg border border-primary/20 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Voice Connected</span>
             <span className="text-xs text-zinc-300 truncate w-32">
               {channels.find(c => c.publicId === activeChannelPublicId)?.name || 'Channel'}
             </span>
             <span className="text-[10px] text-zinc-500">
               {activeVoiceParticipants.length} in call
             </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMuted}
              className={cn(
                "h-8 w-8",
                isMuted
                  ? "text-amber-300 hover:text-amber-200 hover:bg-amber-400/10"
                  : "text-zinc-200 hover:text-white hover:bg-white/10"
              )}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setChannelCall(null)}
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <PhoneOff size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* User Bar */}
      <UserBar user={user} />

      <CreateChannelModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChannel}
        initialType={modalType}
      />
    </div>
  )
}
