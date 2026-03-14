"use client"

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Hash, Volume2, Plus, Users } from 'lucide-react'
import { Button, ScrollArea } from 'packages/ui'
import { cn, api } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'
import ChatList from '../chat/ChatList'
import UserBar from './UserBar'
import { CreateChannelModal } from './zones/CreateChannelModal'


export default function ZoneSidebar({
  user,
}: {
  user: any
}) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams<{ zonePublicId?: string; channelPublicId?: string }>()

  const zonePublicId = params?.zonePublicId
  const [channels, setChannels] = useState<any[]>([])
  const [zone, setZone] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'TEXT' | 'VOICE'>('TEXT')

  const isHome = pathname.startsWith('/zone') && !zonePublicId

  useEffect(() => {
    if (zonePublicId) {
      // Load zone details and channels
      api(`/zones`).then(res => res.json()).then(data => {
        const current = data.zones?.find((z: any) => z.publicId === zonePublicId)
        setZone(current)
      })

      fetchChannels()
    }
  }, [zonePublicId])

  const fetchChannels = () => {
    api(`/zones/${zonePublicId}/channels`).then(res => res.json()).then(data => {
      setChannels(data.channels ?? [])
    })
  }

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
          {zonePublicId ? (zone?.name || 'Loading...') : 'Direct Messages'}
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
                  {channels.filter(c => c.type === 'VOICE').map(channel => (
                    <Button
                      key={channel.publicId}
                      variant="ghost"
                      className="w-full justify-start gap-2 px-2 py-1.5 h-auto rounded-md text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                    >
                      <Volume2 className="h-4 w-4 text-zinc-500" />
                      {channel.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

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

