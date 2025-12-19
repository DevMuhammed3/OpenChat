'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { socket } from '@openchat/lib'
import { Input, Button } from 'packages/ui'
import { Loader2, Send, User } from 'lucide-react'
import { api } from '@openchat/lib'

type Friend = {
  id: number
  username: string
}

type Message = {
  id: number
  text: string
  senderId: number
  pending?: boolean
}

export default function ChatPage() {
  const { username } = useParams<{ username: string }>()
  const [friend, setFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  const endRef = useRef<HTMLDivElement>(null)

  // load friend
  useEffect(() => {
    if (!username) return
    setLoading(true)
    setMessages([])

    api(`/users/${username}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setFriend(data.user))
      .catch(() => setFriend(null))
      .finally(() => setLoading(false))
  }, [username])

  // load messages
  useEffect(() => {
    if (!friend?.id) return

    api(`/messages/${friend.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMessages(data.messages ?? []))
  }, [friend?.id])

  // join room
  useEffect(() => {
    if (!friend?.id) return
    if (!socket.connected) socket.connect()
    socket.emit('join-room', { friendId: friend.id })
  }, [friend?.id])

  // listen
  useEffect(() => {
    const handler = (msg: Message) => {
      setMessages(prev =>
        prev
          .map(m =>
            m.pending && m.text === msg.text ? msg : m
          )
          .concat(prev.some(m => m.id === msg.id) ? [] : [msg])
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
    if (!input.trim() || !friend?.id) return

    // setMessages(prev => [
    //   ...prev,
    //   {
    //     id: Date.now(),
    //     text: input,
    //     senderId: -1,
    //     pending: true,
    //   },
    // ])

    socket.emit('private-message', {
      text: input,
      to: friend.id,
    })

    setInput('')
  }, [input, friend?.id])

  // centered loader
  if (loading) {
    return (
      <div className="flex h-[100svh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!friend) {
    return (
      <div className="flex h-[100svh] items-center justify-center text-muted-foreground">
        User not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100svh]">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="font-semibold">@{friend.username}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${
              m.senderId === friend.id
                ? 'justify-start'
                : 'justify-end'
            }`}
          >
            <div
              className={`px-4 py-2 rounded-lg text-sm max-w-[75%] ${
                m.pending ? 'opacity-50' : ''
              } bg-primary text-primary-foreground`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 bg-background">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
        />
        <Button onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

