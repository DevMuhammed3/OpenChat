'use client'

import { useState, useEffect, useRef } from 'react'
import { socket } from '@openchat/lib'
import { useParams } from 'next/navigation'
import { Input } from 'packages/ui'
import { ArrowLeft, Send, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

    const { username } = useParams() 
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [friend, setFriend] = useState<any>(null)

    const [friendId, setFriendId] = useState<number | null>(null)

    const endRef = useRef<HTMLDivElement>(null)

    // Get logged-in user
    useEffect(() => {
        fetch(`${API_URL}/auth/me`, { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => setUser(data.user))
    }, [])
    //
    // Get friend data via username
    useEffect(() => {
      if (!username) return;

      fetch(`${API_URL}/users/${username}`)
          .then(res => {
              if (!res.ok) {
                  router.push("/chat");
                  return null;
              }
              return res.json();
          })
            .then(data => {
              if (data?.user) {
                  setFriend(data.user);
                 setFriendId(data.user.id);
              }
          });
    }, [username]);

    // useEffect(() => {
    //     if (!username) return
    //
    //     fetch(`${API_URL}/users/${username}`)
    //         .then((res) => res.json())
    //         .then((data) => {
    //             setFriend(data.user)
    //             setFriendId(data.user.id)
    //         })
    // }, [username])

    // Load old messages
    useEffect(() => {
        if (!user || !friendId) return

        fetch(`${API_URL}/messages/${friendId}`, {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => setMessages(data.messages))
    }, [user, friendId])

    // Join socket room + listen
    useEffect(() => {
        if (!user || !friendId) return

        const fid = friendId

        socket.connect()

        socket.emit('join-room', { userId: user.id, friendId: fid })

        socket.on('private-message', (msg: any) => {
            setMessages((prev) => [...prev, msg])
        })

        return () => {
            socket.off('private-message')
            socket.disconnect()
        }
    }, [user, friendId])

    // Auto scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = () => {
        if (!input.trim() || !friendId) return

        socket.emit('private-message', {
            text: input,
            from: user.id,
            to: friendId,
        })

        setInput('')
    }

    return (
        <div className="h-screen flex flex-col p-4" dir="ltr">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="flex items-center gap-3 p-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {friend ? `@${friend.username}` : 'User'}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                            m.senderId === user?.id ? 'text-right' : 'text-left'
                        }
                    >
                        <div
                            className={`inline-block px-4 py-2 rounded-lg ${
                                m.senderId === user?.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800'
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={endRef}></div>
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Type a message…"
                />
                <button
                    onClick={send}
                    className="p-3 bg-blue-600 text-white rounded-lg"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    )
}

