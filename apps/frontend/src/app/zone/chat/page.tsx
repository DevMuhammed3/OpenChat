'use client'

import { useState, useEffect } from 'react'
import { api, socket, getAvatarUrl } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import { useChatsStore } from '@/app/stores/chat-store'
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
    content: string
    createdAt: string
    senderId: number
  }
  unreadCount?: number
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

    socket.on('message:new', (payload: { chatPublicId: string; message: any }) => {
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

  return (
    <div className="h-full flex flex-col bg-[#0b1220]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <button className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
            <p className="text-sm text-zinc-500">Start a conversation with a friend</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredChats.map((chat) => {
              const otherUser = chat.participants[0]
              return (
                <div
                  key={chat.chatPublicId}
                  onClick={() => router.push(`/zone/chat/${chat.chatPublicId}`)}
                  className="flex items-center gap-3 p-3 bg-[#1a1d23] rounded-xl hover:bg-[#22252b] transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                      {otherUser?.avatar ? (
                        <img
                          src={getAvatarUrl(otherUser.avatar)}
                          alt={otherUser.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        otherUser?.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white truncate">
                        {otherUser?.name || otherUser?.username}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-zinc-500">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
