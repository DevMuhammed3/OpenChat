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
import { Info, Loader2, PhoneCall, PhoneOff, Send, User, Video } from 'lucide-react'
import { Menu } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { api } from '@openchat/lib'
import ZoneSidebar from '../../_components/ZoneSidebar'
import { useVoiceCall } from "@/hooks/useVoiceCall"
import { useCallStore } from "@/app/stores/call-store"

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
  const bottomRef = useRef<HTMLDivElement>(null)

  const chats = useChatsStore((s) => s.chats)
  const [user, setUser] = useState<any>(null)
  const {
    startCall,
    inCall,
    acceptCall,
    onCallReject,
    endCall,
    remoteAudioRef,
    ringtoneRef,
  } = useVoiceCall()
  const incoming = useCallStore((s) => s.incoming)

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


  useEffect(() => {
    if (!chatPublicId) return

    const store = useChatsStore.getState()
    store.setActiveChat(chatPublicId)
    store.markChatAsRead(chatPublicId)

    return () => {
      store.setActiveChat(null)
    }
  }, [chatPublicId])

  useEffect(() => {
    const handler = (msg: Message & { chatPublicId: string }) => {
      if (msg.chatPublicId !== chatPublicId) return

      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      )
    }

    socket.on("private-message", handler)
    return () => {
      socket.off("private-message", handler)
    }
  }, [chatPublicId])

  useEffect(() => {
    if (!messagesRef.current) return

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])

  const send = useCallback(() => {
    if (!input.trim() || !chatPublicId) return


    const tempId = Date.now()

    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        text: input,
        senderId: currentUserId!,
      }
    ])

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


        {/* <MicTest /> */}

        <audio ref={remoteAudioRef} autoPlay />
        <audio ref={ringtoneRef} src="/sounds/rining.mp3" preload="auto" />

        {incoming && !inCall && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">
            <Avatar
              className="
              felx justify-center
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

            <p>Incoming call</p>
            <Button onClick={acceptCall}>
              <PhoneCall className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
              Accept
            </Button>
            <Button variant="destructive" onClick={() => onCallReject}>
              <PhoneOff className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
              Reject
            </Button>
          </div>
        )}

        {inCall && (
          <div className="flex justify-center  items-center right-4 bg-black text-white p-4 rounded-xl">
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
            <Button className='bg-red-600 hover:bg-red-600/50 m-2' variant="destructive" onClick={endCall}>
              <PhoneOff className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
              Disconnect
            </Button>
          </div>
        )}

        <Button
          variant="destructive"
          onClick={() => {
            if (!chatPublicId) return
            startCall(chatPublicId)
          }}
        >
          <PhoneCall className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
        </Button>



        <Button
          variant="destructive"
          onClick={() => console.log("You want to VideoCall with me??")}
        >
          <Video className="w-3 h-3 scale-[1.55]" strokeWidth={2} />
        </Button>

        <Button
          variant="destructive"
          onClick={() => console.log("Info")}
        >
          <Info className="w-3 h-3 scale-[1.35]" strokeWidth={2} />
        </Button>


      </div>

      <div
        ref={messagesRef}
        dir="ltr"
        className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4"
      >
        <div className="flex flex-col gap-2 min-h-full justify-end">
          {messages.map((m) => {
            const isMe = m.senderId === currentUserId

            return (
              <div
                key={m.id}
                className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                    isMe
                      ? 'bg-primary/60 text-primary-foreground rounded-br-sm'
                      : 'bg-background/50 text-foreground rounded-bl-sm'
                  )}
                >
                  {m.text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 m-1 p-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-2xl border">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder={
              otherUser ? `Message @${otherUser.username}` : 'Type a message...'
            }
            className="border-0 bg-transparent focus-visible:ring-0"
          />
          <Button size="icon" disabled={!input.trim()} onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div >
  )
}
