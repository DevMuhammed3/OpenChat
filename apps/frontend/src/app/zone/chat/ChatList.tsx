'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, ScrollArea } from 'packages/ui'
import { X } from 'lucide-react'
import { cn } from '@openchat/lib'
import { api } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'
import { useFriendsStore } from '@/app/stores/friends-store'

type User = {
  id: number
  username: string
  avatar?: string | null
}

type ChatItem = {
  chatPublicId: string
  participants: User[]
  lastMessage?: {
    text: string
    createdAt: string
  } | null
}

export default function ChatList() {
  const { chatPublicId } = useParams<{ chatPublicId?: string }>()
  const router = useRouter()

  const friends = useFriendsStore(s => s.friends)

  const chats = useChatsStore(s => s.chats)
  const setChats = useChatsStore(s => s.setChats)
  const hiddenChats = useChatsStore(s => s.hiddenChats)
  const chatsLoaded = useChatsStore(s => s.chatsLoaded)
  const hideChat = useChatsStore(s => s.hideChat)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (chatsLoaded) {
      setLoading(false)
      return
    }

    api('/chats')
      .then(res => res.json())
      .then(data => {
        setChats(data.chats || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [chatsLoaded, setChats])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading chats...</div>
  }

  const visibleChats = chats.filter(
    chat => !hiddenChats.includes(chat.chatPublicId)
  )

  if (visibleChats.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No conversations yet</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {visibleChats.map(chat => {
          const other = chat.participants.find(
            p => friends.find(f => f.id === p.id)
          )

          if (!other) return null

          const isActive = chat.chatPublicId === chatPublicId

          return (
            <button
  key={chat.chatPublicId}
  onClick={() => router.push(`/zone/chat/${chat.chatPublicId}`)}
  className={cn(
    'group w-full flex items-center gap-3 p-3 rounded-lg text-left',
    isActive ? 'bg-muted' : 'hover:bg-muted/50'
  )}
>
              <Avatar>
                <AvatarFallback>
                  {other.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{other.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.lastMessage?.text || 'No messages yet'}
                </p>
              </div>

             <X
  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition"
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

