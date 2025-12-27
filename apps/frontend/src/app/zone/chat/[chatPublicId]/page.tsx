'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { cn, socket } from '@openchat/lib'
import { 
  Input, 
  Button, 
  AvatarFallback, 
  Avatar,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
 } from 'packages/ui'
import { useChatsStore } from '@/app/stores/chat-store'
import { useFriendsStore } from '@/app/stores/friends-store'
import { Loader2, Send } from 'lucide-react'
import {
} from 'packages/ui'
import { Menu } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { api } from '@openchat/lib'
import ZoneSidebar from '../../_components/ZoneSidebar'
// import { Avatar } from '@radix-ui/react-avatar'

type Message = {
  id: number
  text: string
  senderId: number
}

export default function ChatPage() {
  const { chatPublicId } = useParams<{ chatPublicId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  const endRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const chats = useChatsStore(s => s.chats)
  const [user, setUser] = useState<any>(null)
  const friends = useFriendsStore(s => s.friends)

  const chat = chats.find(c => c.chatPublicId === chatPublicId)

  const otherUser =
    chat?.participants.find(p =>
      friends.some(f => f.id === p.id)
    )

useEffect(() => {
  const loadMe = async () => {
    const res = await api('/auth/me', { credentials: 'include' })
    const data = await res.json()

    setCurrentUserId(data.user.id)
    setUser(data.user)
  }

  loadMe()
}, [])



  // load messages
  useEffect(() => {
    if (!chatPublicId) return

    setLoading(true)
    api(`/chats/${chatPublicId}/messages`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMessages(data.messages ?? []))
      .finally(() => setLoading(false))
  }, [chatPublicId])


useEffect(() => {
  if (chat) return

  api(`/chats/${chatPublicId}`)
    .then(res => res.json())
    .then(data => {
      useChatsStore.getState().addChat(data.chat)
    })
}, [chatPublicId, chat])

  // join room
  useEffect(() => {
    if (!chatPublicId) return
    if (!socket.connected) socket.connect()
    socket.emit('join-room', { chatPublicId })
  }, [chatPublicId])

  // listen
  useEffect(() => {
    const handler = (msg: Message) => {
      setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
      )
    }

    socket.on('private-message', handler)
    return () => {
      socket.off('private-message', handler)
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(() => {
    if (!input.trim() || !chatPublicId) return

    socket.emit('private-message', {
      chatPublicId,
      text: input,
    })

    setInput('')
  }, [input, chatPublicId])

  if (loading || !chat || !otherUser) {
    return (
      <div className="flex h-[100svh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100svh]">
<div className="border-b px-4 py-4 flex items-center gap-3">
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <button className="py-2 rounded-md hover:bg-muted">
        <Menu className="h-5 w-5" />
      </button>
    </SheetTrigger>

    <SheetContent side="left" className="p-0 w-80">
      <VisuallyHidden>
        <SheetTitle>Sidebar</SheetTitle>
      </VisuallyHidden>

      <ZoneSidebar user={user} />
    </SheetContent>
  </Sheet>
</div>

      <Avatar className="h-9 w-9">
    <AvatarFallback className="bg-primary text-primary-foreground">
      {otherUser?.username?.[0]?.toUpperCase()}
    </AvatarFallback>
  </Avatar>

  <div className="flex-1">
    <p className="font-medium text-sm">
      {otherUser?.username}
    </p>
  </div>
</div>

<div className="flex-1 overflow-y-auto p-2 md:p-4 flex flex-col justify-end">
{messages.map(m => {
  const isMe = m.senderId === currentUserId

  return (
    <div
      key={m.id}
      className={cn(
        'flex',
        isMe ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words',
          isMe
            ? 'bg-primary my-1 text-primary-foreground rounded-br-sm'
            : 'bg-muted my-1 text-foreground rounded-bl-sm'
        )}
      >
        {m.text}
      </div>
    </div>
  )
})}

        <div ref={endRef} />
      </div>

     <div className="m-1 p-2">
  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
    <Input
      value={input}
      onChange={e => setInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && send()}
      placeholder={ otherUser ? `Message @${otherUser.username}` : `Type a message...`}
      className="border-0 focus-visible:ring-0 bg-transparent"
    />

    <Button
      size="icon"
      onClick={send}
      disabled={!input.trim()}
    >
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>
    </div>
  )
}

