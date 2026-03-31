'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, Skeleton } from 'packages/ui'
import { X } from 'lucide-react'
import { cn, getAvatarUrl, api } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'

// type ChatItem = {
//   chatPublicId: string
//   participants: User[]
//   lastMessage?: {
//     text: string
//     createdAt: string
//   } | null
// }


export default function ChatList({ currentUserId }: { currentUserId?: number | null }) {
  const { chatPublicId } = useParams<{ chatPublicId?: string }>()
  const router = useRouter()


  const chats = useChatsStore((s) => s.chats)
  const setChats = useChatsStore((s) => s.setChats)
  const hiddenChats = useChatsStore((s) => s.hiddenChats)
  const chatsLoaded = useChatsStore((s) => s.chatsLoaded)
  const hideChat = useChatsStore((s) => s.hideChat)

  const [isBootstrapping, setIsBootstrapping] = useState(!chatsLoaded)
  const unreadMap = useChatsStore((s) => s.unread)


  useEffect(() => {
    if (chatsLoaded) {
      return
    }

    api('/chats')
      .then((res) => {
        if (!res.ok) {
          console.error('Failed to load chats:', res.status)
          return { chats: [] }
        }
        return res.json()
      })
      .then((data) => {
        if (data.chats) {
          setChats(data.chats)
        }
        setIsBootstrapping(false)
      })
      .catch((err) => {
        console.error('Failed to load chats:', err)
        setIsBootstrapping(false)
      })
  }, [chatsLoaded, setChats])

  const loading = !chatsLoaded && isBootstrapping

  const visibleChats = chats.filter(
    (chat) => !hiddenChats.includes(chat.chatPublicId)
  )

  useEffect(() => {
    visibleChats.slice(0, 8).forEach((chat) => {
      router.prefetch(`/zone/chat/${chat.chatPublicId}`)
    })
  }, [router, visibleChats])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (visibleChats.length === 0) {
    return (
      <div className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        No conversations
      </div>
    )
  }

  return (
    <div className="space-y-[2px]">
      {visibleChats.map((chat) => {
        const unread = unreadMap[chat.chatPublicId] ?? 0

        const other = currentUserId
          ? chat.participants.find((p) => p.id !== currentUserId)
          : null

        if (!other) return null

        const isActive = chat.chatPublicId === chatPublicId
        const avatarUrl = getAvatarUrl(other.avatar)

        return (
          <button
            key={chat.chatPublicId}
            onClick={() =>
              router.push(`/zone/chat/${chat.chatPublicId}`)
            }
            onPointerEnter={() => router.prefetch(`/zone/chat/${chat.chatPublicId}`)}
            onTouchStart={() => router.prefetch(`/zone/chat/${chat.chatPublicId}`)}
            className={cn(
              'group w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors relative',
              isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={other.username}
                    className="h-full w-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <AvatarFallback className="bg-white/10 text-xs font-bold uppercase transition-colors">
                    {other.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] truncate">
                {other.username}
              </p>
            </div>

            {unread > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}

            <X
              className="h-4 w-4 text-zinc-500 hover:text-red-400
              opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                hideChat(chat.chatPublicId)

                if (isActive) {
                  router.replace('/zone')
                }
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
