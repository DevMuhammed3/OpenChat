"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Hash, Plus, Users, Volume2 } from 'lucide-react'
import { Button, ScrollArea, Skeleton } from 'packages/ui'
import { cn, socket } from '@openchat/lib'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import { CreateChannelModal } from './zones/CreateChannelModal'
import { useCallStore } from '@/app/stores/call-store'
import VoiceParticipants from './voice/VoiceParticipants'
import ActiveSessionBar from './ActiveSessionBar'
import { startVoiceSession } from '@/app/lib/session-runtime'
import { useCreateChannelMutation } from '@/features/channels/mutations'
import { useZoneNavigation } from '@/features/channels/navigation'
import { channelKeys, useChannels, useZoneVoicePresence } from '@/features/channels/queries'
import type { ChannelVoiceParticipant, ZoneVoicePresence } from '@/features/channels/types'
import { useCoarsePointer, usePrefetchOnVisible } from '@/features/prefetch/usePrefetchOnVisible'
import { useUser } from '@/features/user/queries'
import { useZone } from '@/features/zones/queries'

type SidebarUser = {
  id: number
  username: string
  avatar?: string | null
}

function upsertVoicePresenceEntry(
  current: ZoneVoicePresence[],
  channelPublicId: string,
  participants: ChannelVoiceParticipant[],
) {
  const nextPresence = current.filter((entry) => entry.channelPublicId !== channelPublicId)
  nextPresence.push({ channelPublicId, participants })
  return nextPresence
}

export default function ZoneSidebar({
  user,
}: {
  user: SidebarUser | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams<{ zonePublicId?: string; channelPublicId?: string }>()
  const queryClient = useQueryClient()
  const isCoarsePointer = useCoarsePointer()
  const { data: currentUserQuery } = useUser()
  const currentUser = user ?? currentUserQuery ?? null
  const { data: zone } = useZone(params?.zonePublicId)
  const { data: channels = [], isLoading: channelsLoading } = useChannels(params?.zonePublicId)
  const { data: voicePresence = [] } = useZoneVoicePresence(params?.zonePublicId, Boolean(params?.zonePublicId))
  const createChannelMutation = useCreateChannelMutation(params.zonePublicId ?? '')
  const { openChannel, prefetchChannel } = useZoneNavigation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'TEXT' | 'VOICE'>('TEXT')

  const session = useCallStore((state) => state.session)
  const activeChannelPublicId = useCallStore((state) => state.channelPublicId)
  const channelParticipants = useCallStore((state) => state.channelParticipants)
  const upsertChannelParticipant = useCallStore((state) => state.upsertChannelParticipant)
  const isMuted = useCallStore((state) => state.isMuted)
  const isSpeaker = useCallStore((state) => state.isSpeaker)

  const zonePublicId = params?.zonePublicId
  const isHome = pathname.startsWith('/zone') && !zonePublicId
  const previousActiveChannelRef = useRef<string | null>(null)

  const voicePresenceByChannel = useMemo(
    () =>
      Object.fromEntries(
        voicePresence.map((entry) => [entry.channelPublicId, entry.participants ?? []]),
      ) as Record<string, ChannelVoiceParticipant[]>,
    [voicePresence],
  )

  const activeVoiceParticipants = useMemo(
    () => (activeChannelPublicId ? (voicePresenceByChannel[activeChannelPublicId] ?? channelParticipants) : []),
    [activeChannelPublicId, channelParticipants, voicePresenceByChannel],
  )
  const activeVoiceChannel = useMemo(
    () => channels.find((channel) => channel.publicId === activeChannelPublicId) ?? null,
    [activeChannelPublicId, channels],
  )

  useEffect(() => {
    if (zonePublicId && typeof window !== 'undefined') {
      window.localStorage.setItem('openchat:last-zone-public-id', zonePublicId)
    }
  }, [zonePublicId])

  useEffect(() => {
    if (!zonePublicId) return

    const handleVoicePresence = (payload: {
      chatPublicId: string
      channelPublicId: string
      participants: ChannelVoiceParticipant[]
    }) => {
      if (payload.chatPublicId !== zonePublicId) return

      queryClient.setQueryData<ZoneVoicePresence[]>(
        channelKeys.voicePresence(zonePublicId),
        (current = []) => upsertVoicePresenceEntry(current, payload.channelPublicId, payload.participants ?? []),
      )
    }

    socket.on('zone:voice-presence', handleVoicePresence)

    return () => {
      socket.off('zone:voice-presence', handleVoicePresence)
    }
  }, [queryClient, zonePublicId])

  useEffect(() => {
    if (!currentUser || !zonePublicId) return

    const previousChannelId = previousActiveChannelRef.current
    if (previousChannelId && previousChannelId !== activeChannelPublicId) {
      queryClient.setQueryData<ZoneVoicePresence[]>(
        channelKeys.voicePresence(zonePublicId),
        (current = []) =>
          upsertVoicePresenceEntry(
            current,
            previousChannelId,
            (voicePresenceByChannel[previousChannelId] ?? []).filter(
              (participant) => participant.userId !== currentUser.id,
            ),
          ),
      )
    }

    previousActiveChannelRef.current = activeChannelPublicId
  }, [activeChannelPublicId, currentUser, queryClient, voicePresenceByChannel, zonePublicId])

  const handleCreateChannel = async (name: string, type: 'TEXT' | 'VOICE') => {
    if (!zonePublicId) return

    const channel = await createChannelMutation.mutateAsync({ name, type })

    if (channel.type === 'TEXT') {
      await openChannel(zonePublicId, channel.publicId)
    }
  }

  return (
    <div className="w-64 h-full bg-background border-r border-white/5 flex flex-col shrink-0">
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
              <ChatList currentUserId={currentUser?.id} />
            </div>
          </>
        ) : (
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-[2px]">
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
                  {channelsLoading && (
                    <div className="space-y-2 px-2">
                      <Skeleton className="h-8 w-full bg-white/5" />
                      <Skeleton className="h-8 w-full bg-white/5" />
                    </div>
                  )}

                  {channels.filter((channel) => channel.type === 'TEXT').map((channel) => (
                    <TextChannelItem
                      key={channel.publicId}
                      active={params.channelPublicId === channel.publicId}
                      channelName={channel.name}
                      channelPublicId={channel.publicId}
                      isCoarsePointer={isCoarsePointer}
                      onOpen={() => {
                        if (!zonePublicId) return
                        void openChannel(zonePublicId, channel.publicId)
                      }}
                      onPrefetch={() => {
                        if (!zonePublicId) return
                        return prefetchChannel(zonePublicId, channel.publicId)
                      }}
                    />
                  ))}
                </div>
              </div>

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
                  {channels.filter((channel) => channel.type === 'VOICE').map((channel) => {
                    const participants = voicePresenceByChannel[channel.publicId] ?? []

                    return (
                      <div key={channel.publicId} className="space-y-0.5">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (currentUser && zonePublicId) {
                              const localParticipant: ChannelVoiceParticipant = {
                                userId: currentUser.id,
                                socketId: 'local',
                                username: currentUser.username,
                                avatar: currentUser.avatar ?? null,
                                isMuted,
                                isSpeaker,
                              }

                              queryClient.setQueryData<ZoneVoicePresence[]>(
                                channelKeys.voicePresence(zonePublicId),
                                (current = []) => {
                                  const nextParticipants = participants.some(
                                    (participant) => participant.userId === currentUser.id,
                                  )
                                    ? participants
                                    : [...participants, localParticipant]

                                  return upsertVoicePresenceEntry(current, channel.publicId, nextParticipants)
                                },
                              )

                              upsertChannelParticipant(localParticipant)
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

        {session && (
          <ActiveSessionBar
            activeVoiceLabel={activeVoiceChannel?.name}
            participantCount={activeVoiceParticipants.length}
          />
        )}
        <UserBar user={currentUser} />
      </div>

      <CreateChannelModal
        key={modalType}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChannel}
        initialType={modalType}
      />
    </div>
  )
}

function TextChannelItem({
  active,
  channelName,
  channelPublicId,
  isCoarsePointer,
  onOpen,
  onPrefetch,
}: {
  active: boolean
  channelName: string
  channelPublicId: string
  isCoarsePointer: boolean
  onOpen: () => void
  onPrefetch: () => Promise<unknown> | undefined
}) {
  const prefetchRef = usePrefetchOnVisible<HTMLButtonElement>(() => onPrefetch(), {
    enabled: isCoarsePointer,
  })

  return (
    <Button
      ref={prefetchRef}
      key={channelPublicId}
      variant="ghost"
      onClick={onOpen}
      onPointerEnter={() => {
        if (!isCoarsePointer) {
          void onPrefetch()
        }
      }}
      onTouchStart={() => {
        void onPrefetch()
      }}
      className={cn(
        'w-full justify-start gap-1.5 px-2 py-1.5 h-auto rounded-md text-[15px] font-medium transition-colors group',
        active
          ? 'bg-white/10 text-white'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
      )}
    >
      <Hash className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
      <span className="truncate">{channelName}</span>
    </Button>
  )
}
