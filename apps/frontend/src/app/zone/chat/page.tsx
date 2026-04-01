'use client'

import { useState, useEffect } from 'react'
import { api, socket, getAvatarUrl } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import { Search, MessageCircle, Plus } from 'lucide-react'

interface Chat {
  chatPublicId: string
  participants: {
    id: number
    username: string
    avatar?: string | null
    name?: string
  }[]
  lastMessage?: {
    content?: string | null
    text?: string | null
    createdAt: string
    senderId?: number
  }
  unreadCount?: number
}

type IncomingMessage = {
  chatPublicId: string
  message: Chat['lastMessage']
}

export default function ChatListPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true)
        const res = await api('/chats', { credentials: 'include' })
        const data = await res.json()
        
        if (data.chats) {
          setChats(data.chats)
        }
      } catch (err) {
        console.error('Failed to load chats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadChats()

    socket.on('chat:new', (payload: { chat: Chat }) => {
      setChats(prev => [payload.chat, ...prev])
    })

    socket.on('message:new', (payload: IncomingMessage) => {
      setChats(prev => prev.map(chat => 
        chat.chatPublicId === payload.chatPublicId 
          ? { ...chat, lastMessage: payload.message }
          : chat
      ))
    })

    return () => {
      socket.off('chat:new')
      socket.off('message:new')
    }
  }, [])

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants[0]
    return (
      otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    filteredChats.slice(0, 8).forEach((chat) => {
      router.prefetch(`/zone/chat/${chat.chatPublicId}`)
    })
  }, [filteredChats, router])

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Inbox</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Messages</h1>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-12 text-center">
            <MessageCircle className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
            <p className="text-sm text-zinc-500">Start a conversation with a friend</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => {
              const otherUser = chat.participants[0]
              const preview = chat.lastMessage?.content || chat.lastMessage?.text || 'Start the conversation'

              return (
                <button
                  key={chat.chatPublicId}
                  onClick={() => router.push(`/zone/chat/${chat.chatPublicId}`)}
                  onPointerEnter={() => router.prefetch(`/zone/chat/${chat.chatPublicId}`)}
                  onTouchStart={() => router.prefetch(`/zone/chat/${chat.chatPublicId}`)}
                  className="w-full rounded-[28px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition-all hover:bg-white/[0.05] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-primary to-cyan-500 text-white font-bold">
                        {otherUser?.avatar ? (
                          <img
                            src={getAvatarUrl(otherUser.avatar)}
                            alt={otherUser.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          otherUser?.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[15px] font-bold text-white">
                          {otherUser?.name || otherUser?.username}
                        </p>
                        {chat.lastMessage && (
                          <span className="shrink-0 text-[11px] font-medium text-zinc-500">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="truncate text-sm text-zinc-400">
                          {preview}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
