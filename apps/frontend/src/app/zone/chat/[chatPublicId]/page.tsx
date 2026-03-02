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
import { Info, Loader2, Paperclip, PhoneCall, PhoneOff, Send, User, Video, X } from 'lucide-react'
import { Menu, SquarePen, Trash } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { api } from '@openchat/lib'
import ZoneSidebar from '../../_components/ZoneSidebar'
import { useVoiceCall } from "@/hooks/useVoiceCall"
import { useCallStore } from "@/app/stores/call-store"

type Message = {
  id: number
  text: string | null
  senderId: number
  isEdited?: boolean
  isDeleted?: boolean
  fileUrl?: string
  fileType?: string
}

export default function ChatPage() {
  const { chatPublicId } = useParams<{ chatPublicId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [localChat, setLocalChat] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setCalling = useCallStore((s) => s.setCalling)
  const status = useCallStore((s) => s.status)
  // const setCalling = useCallStore((s) => s.setCalling)
  const clear = useCallStore((s) => s.clear)

  // const endRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const chats = useChatsStore((s) => s.chats)
  const [user, setUser] = useState<any>(null)

  // const {
  //   startCall,
  //   inCall,
  //   acceptCall,
  //   onCallReject,
  //   endCall,
  //   remoteAudioRef,
  //   ringtoneRef,
  // } = useVoiceCall()
  // const incoming = useCallStore((s) => s.incoming)

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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const objectUrl = URL.createObjectURL(file)

    setSelectedFile(file)
    setPreviewUrl(objectUrl)

  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !chatPublicId) return

    const formData = new FormData()
    formData.append("file", file)

    const res = await api(`/chats/${chatPublicId}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include"
    })

    const data = await res.json()

    // optimistic update
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        text: null,
        senderId: currentUserId!,
        fileUrl: data.fileUrl,
        fileType: file.type
      }
    ])
  }

  useEffect(() => {
    const handler = (updatedMessage: Message) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === updatedMessage.id ? updatedMessage : m
        )
      )
    }

    socket.on("message:updated", handler)

    return () => {
      socket.off("message:updated", handler)
    }
  }, [])

  useEffect(() => {
    const handler = ({ id }: { id: number }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === id
            ? { ...m, text: null, isDeleted: true }
            : m
        )
      )
    }

    socket.on("message:deleted", handler)

    return () => {
      socket.off("message:deleted", handler)
    }
  }, [])

  useEffect(() => {
    if (!messagesRef.current) return

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])

  const send = useCallback(async () => {
    if (!chatPublicId) return

    if (!input.trim() && !selectedFile) return

    const tempId = Date.now()

    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        text: input || null,
        senderId: currentUserId!,
        fileUrl: previewUrl || undefined,
        fileType: selectedFile?.type
      }
    ])

    try {
      let fileUrl: string | null = null
      let fileType: string | null = null

      if (selectedFile) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const res = await api(`/chats/${chatPublicId}/upload`, {
          method: "POST",
          body: formData,
          credentials: "include"
        })

        const data = await res.json()
        fileUrl = data.fileUrl
        fileType = selectedFile.type
      }

      socket.emit(
        "private-message",
        {
          chatPublicId,
          text: input || null,
          fileUrl,
          fileType
        },
        (savedMessage: Message) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === tempId ? savedMessage : m
            )
          )
        }
      )

      setInput('')
      setSelectedFile(null)
      setPreviewUrl(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

    } catch (err) {
      console.error(err)
    }

  }, [input, selectedFile, chatPublicId, currentUserId, previewUrl])

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

        <Button
          onClick={() => {
            if (!otherUser) return

            socket.emit("call:user", {
              toUserId: otherUser.id,
              chatPublicId
            })

            setCalling(chatPublicId, {
              id: otherUser.id,
              name: otherUser.username,
              image: otherUser.image,
            })
          }}        >
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
                className={cn(
                  'relative flex group',
                  isMe ? 'justify-end' : 'justify-start'
                )}
              >

                <div
                  className={cn(
                    'relative group max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                    isMe
                      ? 'bg-primary/50 text-primary-foreground rounded-br-sm'
                      : 'bg-sky-400/15 text-foreground rounded-bl-sm'
                  )}
                >
                  <div>
                    <div>
                      {editingId === m.id ? (
                        <input
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const res = await api(`/chats/messages/${m.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: editText }),
                                credentials: 'include'
                              })

                              console.log("Edit response:", await res.json())
                              setEditingId(null)
                            }

                            if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                          className="bg-transparent outline-none text-sm w-full"
                        />
                      ) : (
                        <div>

                          {/* Message Text */}
                          <div
                            onDoubleClick={() => {
                              if (m.senderId === currentUserId && !m.isDeleted) return
                              if (m.isDeleted) return
                              setEditingId(m.id)
                              setEditText(m.text ?? '')
                            }}
                          >

                            {m.isDeleted ? (
                              <span className="italic opacity-60">
                                This message was deleted
                              </span>
                            ) : (
                              <>

                                {m.fileUrl ? (
                                  m.fileType?.startsWith("image") ? (
                                    <img
                                      src={m.fileUrl}
                                      className="max-w-xs rounded-lg"
                                    />
                                  ) : (
                                    <a
                                      href={m.fileUrl}
                                      target="_blank"
                                      className="underline text-blue-500"
                                    >
                                      Download File
                                    </a>
                                  )
                                ) : (
                                  m.text
                                )}

                                {m.isEdited && (
                                  <span className="text-[10px] opacity-60 ml-1">
                                    (edited)
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {m.senderId === currentUserId && !m.isDeleted && (
                            <div
                              className="
      absolute -top-5 right-1
      flex gap-1
      opacity-0 translate-y-1
      group-hover:opacity-100 group-hover:translate-y-0
      transition-all duration-200
      z-10
    "
                            >
                              {/* Delete FIRST */}
                              <button
                                onClick={async () => {
                                  const originalText = m.text

                                  setMessages(prev =>
                                    prev.map(msg =>
                                      msg.id === m.id
                                        ? { ...msg, text: null, isDeleted: true }
                                        : msg
                                    )
                                  )

                                  try {
                                    await api(`/chats/messages/${m.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include'
                                    })
                                  } catch {
                                    setMessages(prev =>
                                      prev.map(msg =>
                                        msg.id === m.id
                                          ? { ...msg, text: originalText, isDeleted: false }
                                          : msg
                                      )
                                    )
                                  }
                                }}
                                className="p-1 rounded-md bg-destructive text-white shadow hover:opacity-90"
                              >
                                <Trash className="w-4 h-4" />
                              </button>

                              {/* Edit SECOND */}
                              <button
                                onClick={() => {
                                  setEditingId(m.id)
                                  setEditText(m.text ?? '')
                                }}
                                className="p-1 rounded-md bg-background shadow hover:bg-muted"
                              >
                                <SquarePen className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>


      <div className="relative shrink-0 m-1 p-2">
        {previewUrl && (
          <div className="px-4 mb-2">
            <div className="absolute bottom-20 left-2 w-fit bg-background rounded-2xl p-2 shadow-md">
              <img
                src={previewUrl}
                className="max-h-40 rounded-xl object-cover"
              />

              <button
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded"
              >
                <X />
              </button>
            </div>
          </div>
        )}

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

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className='px-6'
          >
            <Paperclip />
          </Button>

          <Button
            size="icon"
            disabled={!input.trim() && !selectedFile}
            onClick={send}
          >
            <Send className="h-4 w-4" />
          </Button>

        </div>
      </div>
    </div >
  )
}
