'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, ScrollArea } from 'packages/ui'
import { MessageSquare } from 'lucide-react'
import { cn } from '@openchat/lib'
import { api } from '@openchat/lib'
import { useChatsStore } from '@/app/stores/chat-store'

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
  // const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)

const chats = useChatsStore(s => s.chats)
const setChats = useChatsStore(s => s.setChats)

useEffect(() => {
  api('/chats')
    .then(res => res.json())
    .then(data => {
      setChats(data.chats || [])
      setLoading(false)
    })
}, [])

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading chats...
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No conversations yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {chats.map(chat => {
          const other =
            chat.participants.length > 1
              ? chat.participants[1]
              : chat.participants[0]

          const isActive = chat.chatPublicId === chatPublicId

          return (
            <button
              key={chat.chatPublicId}
              onClick={() => router.push(`/chat/${chat.chatPublicId}`)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                isActive ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {other.username?.[0]?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  @{other.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.lastMessage?.text || 'No messages yet'}
                </p>
              </div>

              {isActive && (
                <MessageSquare className="h-4 w-4 text-primary" />
              )}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

