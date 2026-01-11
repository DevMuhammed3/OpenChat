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
import { Loader2, Send, User } from 'lucide-react'
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
    const [localChat, setLocalChat] = useState<any>(null)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)

    // const endRef = useRef<HTMLDivElement>(null)
    const messagesRef = useRef<HTMLDivElement>(null)

    const chats = useChatsStore((s) => s.chats)
    const [user, setUser] = useState<any>(null)
    const friends = useFriendsStore((s) => s.friends)

    const chat = chats.find((c) => c.chatPublicId === chatPublicId)
    const activeChat = chat ?? localChat

    const otherUser = currentUserId
        ? activeChat?.participants.find((p: any) => p.id !== currentUserId)
        : null

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
        if (!activeChat) return

        setLoading(true)
        api(`/chats/${chatPublicId}/messages`, { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => setMessages(data.messages ?? []))
            .finally(() => setLoading(false))
    }, [activeChat])

    useEffect(() => {
        if (!chatPublicId) return

        api(`/chats/${chatPublicId}`)
            .then((res) => res.json())
            .then((data) => {
                setLocalChat(data.chat)
                useChatsStore.getState().addChat(data.chat)
            })
    }, [chatPublicId])

    // join room
    useEffect(() => {
        if (!chatPublicId) return
        const t = setTimeout(() => {
            if (!socket.connected) socket.connect()
            socket.emit('join-room', { chatPublicId })
        }, 500)

        return () => clearTimeout(t)
    }, [chatPublicId])

    // listen
    useEffect(() => {
        const handler = (msg: Message) => {
            setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            )
        }

        socket.on('private-message', handler)
        return () => {
            socket.off('private-message', handler)
        }
    }, [])

    useEffect(() => {
        if (!messagesRef.current) return

        messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }, [messages.length])

    const send = useCallback(() => {
        if (!input.trim() || !chatPublicId) return

        socket.emit('private-message', {
            chatPublicId,
            text: input,
        })

        setInput('')
    }, [input, chatPublicId])

    if (loading || !activeChat) {
        return (
            <div
                className="
                flex items-center justify-center
                h-[100svh]
              "
            >
                <Loader2
                    className="
                    h-8 w-8
                    animate-spin
                  "
                />
            </div>
        )
    }

    return (
        <div
            className="
            flex flex-col
            h-[100svh]
          "
        >
            <div
                className="
                sticky top-0 z-10 flex items-center
                px-4 py-4
                bg-background
                border-b
                gap-3
              "
            >
                <div
                    className="
                    md:hidden
                  "
                >
                    <Sheet>
                        <SheetTrigger asChild>
                            <button
                                className="
                                py-2
                                hover:bg-muted
                                rounded-md
                              "
                            >
                                <Menu
                                    className="
                                    h-5 w-5
                                  "
                                />
                            </button>
                        </SheetTrigger>

                        <SheetContent
                            side="left"
                            className="
                            w-80
                            p-0
                          "
                        >
                            <VisuallyHidden>
                                <SheetTitle>Sidebar</SheetTitle>
                            </VisuallyHidden>

                            <ZoneSidebar user={user} />
                        </SheetContent>
                    </Sheet>
                </div>

                <Avatar
                    className="
                    h-10 w-10
                  "
                >
                    <AvatarFallback
                        className="
                        text-primary-foreground
                      "
                    >
                        <User
                            className="
                            h-5 w-5
                          "
                        />
                    </AvatarFallback>
                </Avatar>

                <div
                    className="
                    flex-1
                  "
                >
                    <p
                        className="
                        font-medium text-sm
                      "
                    >
                        {otherUser?.username}
                    </p>
                </div>
            </div>

            <div
                ref={messagesRef}
                className="
                flex-1 flex flex-col overflow-y-auto justify-end
                p-2 md:p-4
              "
            >
                {messages.map((m) => {
                    const isMe = m.senderId === currentUserId

                    return (
                        <div
                            key={m.id}
                            className={cn(
                                'flex mb-2',
                                isMe ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed',
                                    'break-words break-all whitespace-pre-wrap',
isMe
  ? `
      bg-primary/60
      text-primary-foreground
      backdrop-blur-md
      border border-primary/30
      shadow-sm
      rounded-br-sm
    `
  : `
      bg-background/50
      text-foreground
      backdrop-blur-md
      border border-border/30
      shadow-sm
      rounded-bl-sm
    `
                                )}
                            >
                                {m.text}
                            </div>
                        </div>
                    )
                })}

                <div />
            </div>

            <div
                className="
                m-1 p-2
                shrink
              "
            >
                <div
                    className="
                    flex items-center
                    px-3 py-2
                    bg-background/50
                    rounded-2xl border border-border/30
                    backdrop-blur-lg shadow-lg
                    gap-2
                  "
                >
                    <Input
                        type="text"
                        name="chat_message"
                        id="chat_message"
                        autoComplete="new-password"
                        inputMode="text"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="send"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                send()
                            }
                        }}
                        placeholder={
                            otherUser
                                ? `Message @${otherUser.username}`
                                : 'Type a message...'
                        }
                        className="
    border-0
    bg-transparent
    focus-visible:ring-0
    text-sm
    leading-relaxed
    px-1
    placeholder:text-muted-foreground/60
  "
                    />
                    <Button
                        type="button"
                        size="icon"
                        disabled={!input.trim()}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={send}
                    >
                        <Send
                            className="
                            h-4 w-4
                          "
                        />
                    </Button>
                </div>
            </div>
        </div>
    )
}
