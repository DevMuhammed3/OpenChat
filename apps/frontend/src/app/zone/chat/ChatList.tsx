'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, ScrollArea, Skeleton } from 'packages/ui'
import { User, X } from 'lucide-react'
import { cn, getAvatarUrl, api } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'

type User = {
  id: number
  username: string
  avatar?: string | null
}

// type ChatItem = {
//   chatPublicId: string
//   participants: User[]
//   lastMessage?: {
//     text: string
//     createdAt: string
//   } | null
// }


export default function ChatList() {
  const { chatPublicId } = useParams<{ chatPublicId?: string }>()
  const router = useRouter()


  const chats = useChatsStore((s) => s.chats)
  const setChats = useChatsStore((s) => s.setChats)
  const hiddenChats = useChatsStore((s) => s.hiddenChats)
  const chatsLoaded = useChatsStore((s) => s.chatsLoaded)
  const hideChat = useChatsStore((s) => s.hideChat)

  const [loading, setLoading] = useState(true)
  const unreadMap = useChatsStore((s) => s.unread)

  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    api('/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data.user.id))
  }, [])

  useEffect(() => {
    if (chatsLoaded) {
      setLoading(false)
      return
    }

    api('/chats')
      .then((res) => res.json())
      .then((data) => {
        setChats(data.chats || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [chatsLoaded, setChats])

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

  const visibleChats = chats.filter(
    (chat) => !hiddenChats.includes(chat.chatPublicId)
  )

  if (visibleChats.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No conversations yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
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
              className={cn(
                'group w-full flex items-center gap-3 p-3 rounded-lg text-left',
                isActive ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <Avatar className="h-10 w-10 ring-1 ring-border">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={other.username}
                    className="h-full w-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <AvatarFallback>
                    {other.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {other.username}
                </p>
              </div>

              {unread > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              <X
                className="h-4 w-4 text-muted-foreground hover:text-destructive
                opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
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
    </ScrollArea>
  )
}
