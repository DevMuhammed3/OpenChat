'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, ArrowLeft, LogOut } from 'lucide-react'
import { Button, Input, Avatar, AvatarFallback } from 'packages/ui'
import { toast } from "sonner"
import AddFriend from './friends/AddFriend'
import FriendRequests from './friends/FriendRequests'
import FriendList from './friends/FriendList'
import { socket } from '@openchat/lib'
import { useRouter } from 'next/navigation'
import { cn } from '@openchat/lib'

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

export default function Zone() {
  const [user, setUser] = useState<any>(null)
  const [activeFriend, setActiveFriend] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')

  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  /* ================= AUTH ================= */
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => setUser(data.user))
      .catch(() => router.replace('/auth'))
  }, [])

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!user) return

    socket.connect()
    socket.emit('register', user.id)

    socket.on('private-message', (msg: any) => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      socket.off('private-message')
      socket.disconnect()
    }
  }, [user])

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!user || !activeFriend) return

    fetch(`${API_URL}/messages/${activeFriend.id}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data?.messages) setMessages(data.messages)
      })

    socket.emit('join-room', {
      userId: user.id,
      friendId: activeFriend.id,
    })
  }, [activeFriend, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ================= SEND ================= */
  const sendMessage = () => {
    if (!input.trim() || !activeFriend) return

    socket.emit('private-message', {
      text: input,
      from: user.id,
      to: activeFriend.id,
    })

    setInput('')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={cn(
          'w-full md:w-80 border-r bg-card flex flex-col',
          activeFriend && 'hidden md:flex'
        )}
      >
        <div className="p-4 border-b font-bold">OpenChat</div>

        <div className="flex-1 overflow-y-auto">
          <AddFriend />
          <FriendRequests />
          <FriendList
            selectedFriend={activeFriend}
            onSelectFriend={(f) => {
              setActiveFriend(f)
              setMessages([])
            }}
          />
        </div>

        {user && (
          <div className="border-t p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
<button
  onClick={() => {
    navigator.clipboard.writeText(user.username)
    toast.success("Copied!", {
      description: `@${user.username} copied`,
      duration: 1500,
    })
  }}
  className="text-sm font-medium hover:underline cursor-pointer"
>
  @{user.username}
</button>
            </div>
            <Button
              size="icon"
              variant="destructive"
              onClick={async () => {
                await fetch(`${API_URL}/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                })
                router.replace('/auth')
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* ============ CHAT ============ */}
      <main
        className={cn(
          'flex-1 flex flex-col',
          !activeFriend && 'hidden md:flex'
        )}
      >
        {activeFriend ? (
          <>
            {/* Header */}
            <div className="border-b p-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveFriend(null)}
              >
                <ArrowLeft />
              </Button>
              <Avatar>
                <AvatarFallback>
                  {activeFriend.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">
                @{activeFriend.username}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    m.senderId === user.id
                      ? 'justify-end'
                      : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm break-words',
                      'max-w-[480px]',
                      m.senderId === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4 flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a friend to start chatting
          </div>
        )}
      </main>
    </div>
  )
}

