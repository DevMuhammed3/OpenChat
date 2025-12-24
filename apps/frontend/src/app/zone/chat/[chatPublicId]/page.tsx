'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { socket } from '@openchat/lib'
import { Input, Button } from 'packages/ui'
import { Loader2, Send } from 'lucide-react'
import { api } from '@openchat/lib'

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

useEffect(() => {
  api('/auth/me', { credentials: 'include' })
    .then(res => res.json())
    .then(data => setCurrentUserId(data.user.id))
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

  if (loading) {
    return (
      <div className="flex h-[100svh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100svh]">
      <div className="border-b p-4 font-semibold">Chat</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${
              m.senderId === currentUserId
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div className="px-4 py-2 rounded bg-primary text-primary-foreground">
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <Button onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

