"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Hash, Volume2, Plus, Users, ChevronDown } from 'lucide-react'
import { Button, ScrollArea, Skeleton } from 'packages/ui'
import { cn, api, socket } from '@openchat/lib'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import { CreateChannelModal } from './zones/CreateChannelModal'
import { type ChannelVoiceParticipant, useCallStore } from '@/app/stores/call-store'
import VoiceParticipants from './voice/VoiceParticipants'
import ActiveSessionBar from './ActiveSessionBar'
import { startVoiceSession } from '@/app/lib/session-runtime'

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

  const session = useCallStore(s => s.session)
  const activeChannelPublicId = useCallStore(s => s.channelPublicId)
  const channelParticipants = useCallStore(s => s.channelParticipants)
  const upsertChannelParticipant = useCallStore(s => s.upsertChannelParticipant)
  const isMuted = useCallStore(s => s.isMuted)
  const isSpeaker = useCallStore(s => s.isSpeaker)

  const isHome = pathname.startsWith('/zone') && !zonePublicId
  const previousActiveChannelRef = useRef<string | null>(null)
  const activeVoiceParticipants = useMemo(
    () => (activeChannelPublicId ? (voicePresence[activeChannelPublicId] ?? channelParticipants) : []),
    [activeChannelPublicId, channelParticipants, voicePresence],
  )
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
    if (zonePublicId && typeof window !== 'undefined') {
      window.localStorage.setItem('openchat:last-zone-public-id', zonePublicId)
    }
  }, [zonePublicId])

  useEffect(() => {
    if (!user) return

    const previousChannelId = previousActiveChannelRef.current
    if (previousChannelId && previousChannelId !== activeChannelPublicId) {
      setVoicePresence((prev) => ({
        ...prev,
        [previousChannelId]: (prev[previousChannelId] ?? []).filter((participant) => participant.userId !== user.id),
      }))
    }

    previousActiveChannelRef.current = activeChannelPublicId
  }, [activeChannelPublicId, user])

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

    return () => {
      cancelled = true
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
    <div className="w-64 h-full bg-background border-r border-white/5 flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 border-b border-white/5 flex items-center shadow-sm hover:bg-white/[0.02] cursor-pointer transition-colors group">
        <h2 className="font-bold text-white text-[15px] truncate flex-1 leading-tight">
          {zonePublicId ? (zone?.name || <Skeleton className="h-4 w-24 bg-white/5" />) : 'Direct Messages'}
        </h2>
        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
      </div>

      <div className="flex-1 flex flex-col min-h-0 pt-3">
        {isHome ? (
          <>
            <div className="px-2 mb-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/zone')}
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2 rounded-md text-[15px] font-medium transition-colors',
                  pathname === '/zone' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                )}
              >
                <Users className="h-5 w-5" />
                Friends
              </Button>
            </div>

            <div className="px-2 mb-2 mt-4 flex items-center justify-between group">
              <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-2">Direct Messages</span>
              <Plus className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 chat-list-scrollbar">
              <ChatList currentUserId={user?.id} />
            </div>
          </>
        ) : (
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-[2px]">
              {/* Text Channels */}
              <div className="mb-4">
                <div className="px-2 py-1 flex items-center justify-between group">
                  <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wide leading-3">
                    Text Channels
                  </p>
                  <Plus
                    className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setModalType('TEXT'); setIsModalOpen(true); }}
                  />
                </div>
                <div className="space-y-[2px] mt-1">
                  {channels.filter(c => c.type === 'TEXT').map(channel => (
                    <Button
                      key={channel.publicId}
                      variant="ghost"
                      onClick={() => router.push(`/zone/zones/${zonePublicId}/channels/${channel.publicId}`)}
                      className={cn(
                        'w-full justify-start gap-1.5 px-2 py-1.5 h-auto rounded-md text-[15px] font-medium transition-colors group',
                        params.channelPublicId === channel.publicId
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      )}
                    >
                      <Hash className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                      <span className="truncate">{channel.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Voice Channels */}
              <div className="mb-4">
                <div className="px-2 py-1 flex items-center justify-between group">
                  <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wide leading-3">
                    Voice Channels
                  </p>
                  <Plus
                    className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setModalType('VOICE'); setIsModalOpen(true); }}
                  />
                </div>
                <div className="space-y-[2px] mt-1">
                  {channels.filter(c => c.type === 'VOICE').map(channel => {
                    const participants = voicePresence[channel.publicId] ?? []

                    return (
                      <div key={channel.publicId} className="space-y-0.5">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (user) {
                              setVoicePresence((prev) => {
                                const nextParticipants = prev[channel.publicId] ?? []
                                if (nextParticipants.some((participant) => participant.userId === user.id)) {
                                  return prev
                                }

                                return {
                                  ...prev,
                                  [channel.publicId]: [
                                    ...nextParticipants,
                                    {
                                      userId: user.id,
                                      socketId: 'local',
                                      username: user.username,
                                      avatar: user.avatar ?? null,
                                      isMuted,
                                      isSpeaker,
                                    },
                                  ],
                                }
                              })

                              upsertChannelParticipant({
                                userId: user.id,
                                socketId: 'local',
                                username: user.username,
                                avatar: user.avatar ?? null,
                                isMuted,
                                isSpeaker,
                              })
                            }

                            void startVoiceSession(channel.publicId)
                          }}
                          className={cn(
                            "w-full justify-start gap-1.5 px-2 py-1.5 h-auto rounded-md text-[15px] font-medium transition-colors group",
                            activeChannelPublicId === channel.publicId 
                              ? "bg-white/10 text-white" 
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          )}
                        >
                          <Volume2 className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                          <span className="truncate">{channel.name}</span>
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

      {session && (
        <ActiveSessionBar
          activeVoiceLabel={channels.find(c => c.publicId === activeChannelPublicId)?.name || 'Voice channel'}
          participantCount={activeVoiceParticipants.length}
        />
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
