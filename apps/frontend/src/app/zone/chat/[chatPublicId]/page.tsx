'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn, socket } from '@openchat/lib'
import {
  Input,
  Button,
  AvatarFallback,
  Avatar,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Skeleton,
} from 'packages/ui'
import { useChatsStore } from '@/app/stores/chat-store'
import { ArrowLeft, Info, Paperclip, PhoneCall, Pin, Send, ShieldBan, User, UserMinus, Video, X, Smile, Sticker as StickerIcon, Gift, SquarePen, Trash, Search } from 'lucide-react'
import { api, getAvatarUrl } from '@openchat/lib'
import MessageText from '../../_components/chat/MessageText'
import GifPicker from '../../_components/chat/GifPicker'
import StickerPicker from '../../_components/chat/StickerPicker'
// import { useVoiceCall } from "@/hooks/useVoiceCall"
import { useCallStore } from "@/app/stores/call-store"
import { startOutgoingCallSession } from "@/app/lib/session-runtime"
import { useUserStore } from '@/app/stores/user-store'

type Message = {
  id: number
  text: string | null
  senderId: number
  isEdited?: boolean
  isPinned?: boolean
  isDeleted?: boolean
  fileUrl?: string | null
  fileType?: string | null
  createdAt?: string
  pinnedAt?: string | null
}

type ChatParticipant = {
  id: number
  username: string
  avatar?: string | null
}

type ChatData = {
  chatPublicId: string
  participants: ChatParticipant[]
  type?: 'DM' | 'ZONE'
  name?: string | null
  avatar?: string | null
}

function getMessageTimestamp(message: Message) {
  if (message.createdAt) {
    const parsed = new Date(message.createdAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }

  return message.id
}

function sortMessages(messages: Message[]) {
  return [...messages].sort((a, b) => {
    const timeDiff = getMessageTimestamp(a) - getMessageTimestamp(b)
    return timeDiff !== 0 ? timeDiff : a.id - b.id
  })
}

function mergeMessage(messages: Message[], message: Message) {
  const deduped = messages.filter((item) => item.id !== message.id)
  deduped.push(message)
  return sortMessages(deduped)
}

function getDisplayName(participant?: ChatParticipant | null) {
  return participant?.username || 'User'
}

function renderAttachment(message: Message) {
  if (!message.fileUrl) return null

  if (message.fileType?.startsWith("image")) {
    return (
      <img
        src={message.fileUrl}
        className="mt-2 max-w-xs rounded-lg ring-1 ring-white/10"
      />
    )
  }

  return (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="underline text-blue-400"
    >
      Download File
    </a>
  )
}

export default function ChatPage() {
  const { chatPublicId } = useParams<{ chatPublicId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [input, setInput] = useState('')
  const [localChat, setLocalChat] = useState<ChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const [headerActionBusy, setHeaderActionBusy] = useState(false)
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false)
  const [showGifs, setShowGifs] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // const endRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const chats = useChatsStore((s) => s.chats)
  const hideChat = useChatsStore((s) => s.hideChat)
  const currentUser = useUserStore((s) => s.user)
  const speakingUsers = useCallStore(s => s.speakingUsers)

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

  const chat = chats.find((c) => c.chatPublicId === chatPublicId) as ChatData | undefined
  const activeChat = chat ?? localChat

  const isGroup = activeChat?.type === "ZONE"

  const otherUser = !isGroup && currentUserId
    ? activeChat?.participants.find((participant) => participant.id !== currentUserId)
    : null

  const pinnedMessages = (messages ?? [])
    .filter((message) => message.isPinned && !message.isDeleted)
    .sort((a, b) => {
      const aPinnedAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
      const bPinnedAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
      return bPinnedAt - aPinnedAt
    })

  useEffect(() => {
    if (!currentUser) return
    setCurrentUserId(currentUser.id)
  }, [currentUser])

  useEffect(() => {
    if (!chatPublicId) return

    api(`/chats/${chatPublicId}/messages`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          console.error('Failed to load messages:', res.status)
          return { messages: [] }
        }
        return res.json()
      })
      .then((data) => {
        if (data.messages) {
          setMessages(sortMessages(data.messages))
        }
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setLoading(false))
  }, [chatPublicId])

  useEffect(() => {
    if (!chatPublicId) return

    api(`/chats/${chatPublicId}`)
      .then((res) => {
        if (!res.ok) {
          console.error('Failed to load chat:', res.status)
          return { chat: null }
        }
        return res.json()
      })
      .then((data) => {
        if (data.chat) {
          setLocalChat(data.chat)
          useChatsStore.getState().upsertChat(data.chat)
        } else {
          console.error('Chat not found:', data.message)
        }
      })
      .catch((err) => console.error('Failed to load chat:', err))
  }, [chatPublicId])


  useEffect(() => {
    if (!chatPublicId) return

    const store = useChatsStore.getState()
    store.setActiveChat(chatPublicId)
    store.markChatAsRead(chatPublicId)
    socket.emit('join-room', { chatPublicId })

    return () => {
      socket.emit('leave-room', { chatPublicId })
      store.setActiveChat(null)
    }
  }, [chatPublicId])

  useEffect(() => {
    const handler = (msg: Message & { chatPublicId: string }) => {
      if (msg.chatPublicId !== chatPublicId) return

      setMessages((prev) => mergeMessage(prev ?? [], msg))
    }

    socket.on("private-message", handler)
    return () => {
      socket.off("private-message", handler)
    }
  }, [chatPublicId])

  useEffect(() => {
    if (!chatPublicId) return

    const handler = ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (isTyping) next.add(userId)
        else next.delete(userId)
        return next
      })
    }

    socket.on("chat:typing", handler)
    return () => {
      socket.off("chat:typing", handler)
    }
  }, [chatPublicId])

  useEffect(() => {
    const handlePinned = (payload: { id: number; isPinned: boolean; pinnedAt: string | null }) => {
      setMessages((prev) =>
        (prev ?? []).map((message) =>
          message.id === payload.id
            ? { ...message, isPinned: payload.isPinned, pinnedAt: payload.pinnedAt }
            : message
        )
      )
    }

    socket.on("message:pinned", handlePinned)

    return () => {
      socket.off("message:pinned", handlePinned)
    }
  }, [])

  const handleInputChange = (val: string) => {
    setInput(val)

    if (!chatPublicId) return

    // Emit typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    } else {
      socket.emit("chat:typing", { chatPublicId, isTyping: true })
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing", { chatPublicId, isTyping: false })
      typingTimeoutRef.current = null
    }, 3000)
  }

  const removeCurrentFriend = useCallback(async () => {
    if (!otherUser || !chatPublicId) return

    try {
      setHeaderActionBusy(true)
      const res = await api(`/friends/${otherUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Failed to remove friend')
      }
      hideChat(chatPublicId)
      router.push('/zone')
    } finally {
      setHeaderActionBusy(false)
    }
  }, [chatPublicId, hideChat, otherUser, router])

  const blockCurrentFriend = useCallback(async () => {
    if (!otherUser || !chatPublicId) return

    try {
      setHeaderActionBusy(true)
      const res = await api(`/friends/block/${otherUser.id}`, { method: 'POST' })
      if (!res.ok) {
        throw new Error('Failed to block user')
      }
      hideChat(chatPublicId)
      router.push('/zone')
    } finally {
      setHeaderActionBusy(false)
    }
  }, [chatPublicId, hideChat, otherUser, router])

  const togglePinMessage = useCallback(async (messageId: number) => {
    await api(`/chats/messages/${messageId}/pin`, {
      method: 'PATCH',
      credentials: 'include',
    })
  }, [])

  const scrollToMessage = useCallback((messageId: number) => {
    const element = document.getElementById(`message-${messageId}`)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

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

  const clearSelectedFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(null)
    setPreviewUrl(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  // const handleFileUpload = async (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = e.target.files?.[0]
  //   if (!file || !chatPublicId) return
  //
  //   const formData = new FormData()
  //   formData.append("file", file)
  //
  //   const res = await api(`/chats/${chatPublicId}/upload`, {
  //     method: "POST",
  //     body: formData,
  //     credentials: "include"
  //   })
  //
  //   const data = await res.json()
  //
  //   // optimistic update
  //   setMessages(prev => [
  //     ...prev,
  //     {
  //       id: Date.now(),
  //       text: null,
  //       senderId: currentUserId!,
  //       fileUrl: data.fileUrl,
  //       fileType: file.type
  //     }
  //   ])
  // }


  useEffect(() => {
    const handler = (updatedMessage: Message) => {
      setMessages(prev =>
        (prev ?? []).map(m =>
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
        (prev ?? []).map(m =>
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
  }, [messages?.length])

  const send = useCallback(async () => {
    if (!chatPublicId) return

    const text = input.trim()

    if (!text && !selectedFile) return

    const tempId = Date.now()
    const optimisticMessage: Message = {
      id: tempId,
      text: text || null,
      senderId: currentUserId!,
      fileUrl: previewUrl || undefined,
      fileType: selectedFile?.type,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => mergeMessage(prev ?? [], optimisticMessage))

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
          text: text || null,
          fileUrl,
          fileType
        },
        (savedMessage?: Message) => {
          if (!savedMessage || typeof savedMessage.id !== "number") {
            setMessages((prev) => (prev ?? []).filter((message) => message.id !== tempId))
            return
          }

          setMessages((prev) => {
            const withoutOptimistic = (prev ?? []).filter((message) => message.id !== tempId)
            return mergeMessage(withoutOptimistic, savedMessage)
          })

          useChatsStore.getState().bumpChat(chatPublicId, {
            text: savedMessage.text || (savedMessage.fileUrl ? 'Sent a file' : ''),
            createdAt: savedMessage.createdAt || new Date().toISOString(),
          })
        }
      )

      setInput('')
      clearSelectedFile()

    } catch (err) {
      setMessages((prev) => (prev ?? []).filter((message) => message.id !== tempId))
      console.error(err)
    }

  }, [chatPublicId, clearSelectedFile, currentUserId, input, previewUrl, selectedFile])

  if (!messages || !activeChat) {
    if (!loading) {
      return (
        <div className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-background">
          <p className="text-zinc-400 mb-2">Unable to load chat</p>
          <p className="text-zinc-500 text-sm">Make sure you're logged in and the chat exists</p>
        </div>
      )
    }
    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-background animate-in fade-in duration-500">
        <div className="h-16 border-b flex items-center px-4 gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
              <Skeleton className={cn("h-12 w-48 rounded-2xl", i % 2 === 0 ? "rounded-br-sm" : "rounded-bl-sm")} />
            </div>
          ))}
        </div>
        <div className="p-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="
            flex flex-col
            h-full min-h-0 w-full
          "
    >
      <div
        className="
                sticky top-0 z-10 flex items-center shrink-0
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
          <button
            onClick={() => router.push('/zone/chat')}
            className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-muted hover:text-white"
            aria-label="Back to messages"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <Avatar
            className="
                    h-10 w-10
                  "
          >
            <AvatarImage src={getAvatarUrl(otherUser?.avatar)} />
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
          {otherUser && speakingUsers.has(otherUser.id) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#313338] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          )}
        </div>

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
            {isGroup ? activeChat?.name : otherUser?.username}
          </p>
          {pinnedMessages.length > 0 && (
            <button
              className="mt-1 flex items-center gap-1 text-[11px] text-amber-300"
              onClick={() => setPinnedPanelOpen(true)}
            >
              <Pin className="h-3 w-3" />
              {pinnedMessages.length} pinned
            </button>
          )}
        </div>


        {/* <MicTest /> */}

        <Button
          onClick={() => {
            if (!otherUser || !chatPublicId) return

            void startOutgoingCallSession({
              chatPublicId,
              toUserId: otherUser.id,
              user: {
                id: otherUser.id,
                name: otherUser.username,
                image: otherUser.avatar,
              },
            })
          }}
        >
          <PhoneCall className="w-3 h-3 scale-[1.25]" strokeWidth={2} />
        </Button>



        <Button
          variant="destructive"
        >
          <Video className="w-3 h-3 scale-[1.55]" strokeWidth={2} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              disabled={!otherUser || headerActionBusy}
            >
              <Info className="w-3 h-3 scale-[1.35]" strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={removeCurrentFriend}
              className="cursor-pointer"
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove Friend
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={blockCurrentFriend}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <ShieldBan className="mr-2 h-4 w-4" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


      </div>

      <Sheet open={pinnedPanelOpen} onOpenChange={setPinnedPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetTitle>Pinned Messages</SheetTitle>
          <SheetDescription>
            Quick access to the most important messages in this chat.
          </SheetDescription>

          <div className="mt-6 space-y-3">
            {pinnedMessages.length === 0 && (
              <p className="text-sm text-muted-foreground">No pinned messages yet.</p>
            )}

            {pinnedMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  setPinnedPanelOpen(false)
                  window.setTimeout(() => scrollToMessage(message.id), 100)
                }}
                className="w-full rounded-2xl border bg-background/60 p-3 text-left transition hover:bg-muted/40"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-amber-400">
                  <Pin className="h-3.5 w-3.5" />
                  <span>Pinned message</span>
                </div>
                <p className="line-clamp-3 text-sm text-zinc-200">
                  {message.text || (message.fileUrl ? 'Attachment' : 'Message')}
                </p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <div
        ref={messagesRef}
        dir="ltr"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 w-full overscroll-y-contain"
      >
        <div className="flex flex-col min-h-full justify-end">
          {messages.map((m, idx) => {
            const isMe = m.senderId === currentUserId
            const sender = isMe ? currentUser : otherUser
            const prevMsg = messages[idx - 1]
            const isGrouped = !!prevMsg && prevMsg.senderId === m.senderId &&
              (getMessageTimestamp(m) - getMessageTimestamp(prevMsg) < 300000)

            if (isGrouped) {
              return (
                <div
                  id={`message-${m.id}`}
                  key={m.id}
                  className="pl-[72px] pr-4 py-1 hover:bg-white/[0.02] transition-colors group relative"
                >
                  {m.isPinned && !m.isDeleted && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-amber-300">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </div>
                  )}
                  {editingId === m.id ? (
                    <div>
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

                            setEditingId(null)
                          }

                          if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className="bg-transparent outline-none text-sm w-full text-zinc-200"
                      />
                      {renderAttachment(m)}
                    </div>
                  ) : (
                    <div
                      className="text-[14px] text-zinc-300 leading-[1.375rem] whitespace-pre-wrap break-words break-all min-w-0 overflow-hidden"
                      onDoubleClick={() => {
                        if (!isMe || m.isDeleted) return

                        setEditingId(m.id)
                        setEditText(m.text ?? '')
                      }}
                    >
                      {m.isDeleted ? (
                        <span className="text-zinc-500 italic">This message was deleted</span>
                      ) : (
                        <>
                          {m.text && (
                            <div className={m.fileUrl ? "mb-2" : undefined}>
                              <MessageText text={m.text} />
                            </div>
                          )}
                          {renderAttachment(m)}
                          {m.isEdited && (
                            <span className="text-[10px] opacity-60 ml-1">(edited)</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isMe && !m.isDeleted && (
                    <div className="absolute -top-5 right-1 flex gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10">
                      <button
                        onClick={() => {
                          void togglePinMessage(m.id)
                        }}
                        className={cn(
                          "p-1 rounded-md shadow",
                          m.isPinned ? "bg-amber-500 text-black" : "bg-background hover:bg-muted"
                        )}
                      >
                        <Pin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={async () => {
                          const originalText = m.text

                          setMessages(prev =>
                            (prev ?? []).map(msg =>
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
                              (prev ?? []).map(msg =>
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
              )
            }

            return (
              <div
                id={`message-${m.id}`}
                key={m.id}
                className="flex gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors mt-2 group relative max-w-full overflow-hidden"
              >
                <Avatar className="h-10 w-10 shrink-0 mt-0.5 ring-1 ring-white/5">
                  <AvatarImage src={getAvatarUrl(sender?.avatar)} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getDisplayName(sender)[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">
                      {isMe ? 'You' : getDisplayName(sender)}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(getMessageTimestamp(m)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.isPinned && !m.isDeleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-amber-300">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {editingId === m.id ? (
                    <div>
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

                            setEditingId(null)
                          }

                          if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className="bg-transparent outline-none text-sm w-full text-zinc-200"
                      />
                      {renderAttachment(m)}
                    </div>
                  ) : (
                    <div
                      className="text-[14px] text-zinc-300 leading-[1.375rem] whitespace-pre-wrap break-words break-all min-w-0 overflow-hidden"
                      onDoubleClick={() => {
                        if (!isMe || m.isDeleted) return

                        setEditingId(m.id)
                        setEditText(m.text ?? '')
                      }}
                    >
                      {m.isDeleted ? (
                        <span className="text-zinc-500 italic">This message was deleted</span>
                      ) : (
                        <>
                          {m.text && (
                            <div className={m.fileUrl ? "mb-2" : undefined}>
                              <MessageText text={m.text} />
                            </div>
                          )}
                          {renderAttachment(m)}
                          {m.isEdited && (
                            <span className="text-[10px] opacity-60 ml-1">(edited)</span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isMe && !m.isDeleted && (
                  <div className="absolute top-2 right-4 flex gap-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10">
                    <button
                      onClick={() => {
                        void togglePinMessage(m.id)
                      }}
                      className={cn(
                        "p-1 rounded-md shadow",
                        m.isPinned ? "bg-amber-500 text-black" : "bg-background hover:bg-muted"
                      )}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={async () => {
                        const originalText = m.text

                        setMessages(prev =>
                          (prev ?? []).map(msg =>
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
                            (prev ?? []).map(msg =>
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
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="relative shrink-0 border-t border-white/5 bg-background/95 px-2 pt-2 safe-bottom backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        {previewUrl && (
          <div className="px-4 mb-2">
            <div className="absolute bottom-20 left-2 w-fit bg-background rounded-2xl p-2 shadow-md">
              <img
                src={previewUrl}
                className="max-h-40 rounded-xl object-cover"
              />

              <button
                onClick={clearSelectedFile}
                className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded"
              >
                <X />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-background/50 rounded-2xl border border-white/5 relative">
          {typingUsers.size > 0 && Array.from(typingUsers).map(uid => {
            const user = activeChat?.participants.find((participant) => participant.id === uid)
            if (!user) return null
            return (
              <div key={user.id} className="absolute -top-7 left-4 text-[11px] font-medium text-zinc-400 animate-in slide-in-from-bottom-1 duration-200">
                {user.username} is typing...
              </div>
            )
          })}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-400 hover:text-zinc-200 shrink-0 h-9 w-9"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder={
              otherUser ? `Message @${otherUser.username}` : 'Type a message...'
            }
            className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-zinc-500 min-w-0"
          />

          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
             <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-400 hover:text-zinc-200" title="Gift Nitro">
                <Gift className="h-5 w-5" />
             </Button>

             <div className="relative">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn("h-9 w-9 transition-colors", showGifs ? "text-primary" : "text-zinc-400 hover:text-zinc-200")} 
                  onClick={() => { setShowGifs(!showGifs); setShowStickers(false); }}
                  title="Send GIF"
                >
                   <Search className="h-5 w-5" strokeWidth={2.5} />
                </Button>
                {showGifs && (
                  <GifPicker 
                    onClose={() => setShowGifs(false)} 
                    onSelect={(url) => {
                      setInput(url)
                      setShowGifs(false)
                    }} 
                  />
                )}
             </div>

             <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-400 hover:text-zinc-200" title="Pick an Emoji">
                <Smile className="h-5 w-5" />
             </Button>

             <div className="relative">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className={cn("h-9 w-9 transition-colors", showStickers ? "text-primary" : "text-zinc-400 hover:text-zinc-200")} 
                  onClick={() => { setShowStickers(!showStickers); setShowGifs(false); }}
                  title="Custom Stickers"
                >
                   <StickerIcon className="h-5 w-5" />
                </Button>
                {showStickers && (
                  <StickerPicker 
                    onClose={() => setShowStickers(false)} 
                    onSelect={(url) => {
                       socket.emit("private-message", {
                         chatPublicId,
                         text: null,
                         fileUrl: url,
                         fileType: "image/gif"
                       })
                       setShowStickers(false)
                    }} 
                  />
                )}
             </div>
          </div>

          <Button
            size="icon"
            disabled={!input.trim() && !selectedFile}
            onClick={send}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 w-9 flex-shrink-0 ml-1"
          >
            <Send className="h-4 w-4" />
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div >
  )
}
