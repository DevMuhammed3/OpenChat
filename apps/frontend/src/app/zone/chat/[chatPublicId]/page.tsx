'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { cn, socket } from '@openchat/lib'
import {
  Input,
  Button,
  AvatarFallback,
  Avatar,
  AvatarImage,
  DropdownMenuItem,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Skeleton,
} from 'packages/ui'
import { useChatsStore } from '@/app/stores/chat-store'
import { ArrowLeft, Paperclip, Pin, Send, ShieldBan, UserMinus, X, Smile, Sticker as StickerIcon, Gift, SquarePen, Trash, Search, PanelRight } from 'lucide-react'
import { api, getAvatarUrl } from '@openchat/lib'
import MessageText from '../../_components/chat/MessageText'
const GifPicker = dynamic(() => import('../../_components/chat/GifPicker'), { ssr: false })
const EmojiPicker = dynamic(() => import('../../_components/chat/EmojiPicker'), { ssr: false })
const StickerPicker = dynamic(() => import('../../_components/chat/StickerPicker'), { ssr: false })
import { startOutgoingCallSession } from "@/app/lib/session-runtime"
import { useUserStore } from '@/app/stores/user-store'
import { EmptyChatState } from '@/components/EmptyChatState'
import { ChatHeader } from '@/components/ChatHeader'
import { useFriendsStore } from '@/app/stores/friends-store'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ProfileModal } from '@/components/ProfileModal'
import { useChatQuery } from '@/features/chat/useChatQuery'
import { useChatSocket } from '@/features/chat/useChatSocket'
import { useSendDirectMessageMutation } from '@/features/chat/mutations'

type ChatParticipant = {
  id: number
  username: string
  name?: string | null
  avatar?: string | null
  isOnline?: boolean
}

type ChatData = {
  chatPublicId: string
  participants: ChatParticipant[]
  type?: 'DM' | 'ZONE'
  name?: string | null
  avatar?: string | null
}

function getMessageTimestamp(message: { createdAt?: string; id: number }) {
  if (message.createdAt) {
    const parsed = new Date(message.createdAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  return message.id
}

function getDisplayName(participant?: ChatParticipant | null) {
  return participant?.username || 'User'
}

function renderAttachment(message: { fileUrl?: string | null; fileType?: string | null }) {
  if (!message.fileUrl) return null

  if (message.fileType?.startsWith("image")) {
    return (
      <img
        src={message.fileUrl}
        className="mt-2 max-w-xs rounded-lg ring-1 ring-white/10"
        alt="Attachment"
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
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const [headerActionBusy, setHeaderActionBusy] = useState(false)
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false)
  const [showGifs, setShowGifs] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profile, setProfile] = useState<{
    id: string | number
    name: string
    avatar?: string | null
    bio?: string | null
    friendStatus?: 'none' | 'pending' | 'accepted'
    mutualFriends?: { id: string; name: string }[]
    mutualZones?: { id: string; name: string }[]
    joinedAt?: string | null
    isOnline?: boolean
    lastSeen?: string | null
  } | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)

  const chats = useChatsStore((s) => s.chats)
  const hideChat = useChatsStore((s) => s.hideChat)
  const currentUser = useUserStore((s) => s.user)
  const onlineUsers = useFriendsStore((s) => s.onlineUsers)

  const {
    data: messages = [],
    isLoading: messagesLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChatQuery(chatPublicId, chatPublicId)

  useChatSocket(chatPublicId)

  const sendMessageMutation = useSendDirectMessageMutation(chatPublicId)

  const chat = chats.find((c) => c.chatPublicId === chatPublicId) as ChatData | undefined

  const isGroup = chat?.type === "ZONE"

  const otherUser = !isGroup && currentUser && chat
    ? chat.participants.find((participant) => participant.id !== currentUser.id)
    : null

  const emptyChatName = isGroup
    ? (chat?.name ?? 'Group')
    : (otherUser?.name ?? otherUser?.username ?? 'User')

  const sidebarProfile = !isGroup && otherUser
    ? {
        id: otherUser.id,
        name: otherUser.name ?? otherUser.username ?? 'User',
        avatar: otherUser.avatar ?? null,
      }
    : null

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsSidebarOpen((prev) => !prev)
      return
    }
    setIsSidebarSheetOpen(true)
  }

  const resolvedProfile = profile ?? sidebarProfile
  const canManageFriend = Boolean(currentUser && otherUser && currentUser.id !== otherUser.id)

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true)
    setIsSidebarSheetOpen(false)
  }

  const pinnedMessages = messages
    .filter((message) => message.isPinned && !message.isDeleted)
    .sort((a, b) => {
      const aPinnedAt = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
      const bPinnedAt = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
      return bPinnedAt - aPinnedAt
    })

  useEffect(() => {
    if (!otherUser?.username) {
      setProfile(null)
      return
    }

    let active = true

    api(`/users/${otherUser.username}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return
        const user = data?.user
        if (!user) {
          setProfile(null)
          return
        }
        setProfile({
          id: user.id,
          name: user.name ?? user.username ?? 'User',
          avatar: user.avatar ?? null,
          bio: user.bio ?? null,
          friendStatus: user.friendStatus,
          mutualFriends: Array.isArray(user.mutualFriends) ? user.mutualFriends : undefined,
          mutualZones: Array.isArray(user.mutualZones) ? user.mutualZones : undefined,
          joinedAt: user.createdAt ?? null,
          isOnline: user.isOnline ?? undefined,
          lastSeen: user.lastLogin ?? null,
        })
      })
      .catch(() => {
        if (active) setProfile(null)
      })

    return () => {
      active = false
    }
  }, [otherUser?.username])

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
          useChatsStore.getState().upsertChat(data.chat)
        }
      })
      .catch(() => {})
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
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length, messagesLoading])

  useEffect(() => {
    if (!topSentinelRef.current || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root: messagesRef.current, rootMargin: '200px' },
    )

    observer.observe(topSentinelRef.current)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleInputChange = (val: string) => {
    setInput(val)

    if (!chatPublicId) return

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

  const addFriend = useCallback(async () => {
    if (!otherUser?.username) return

    const res = await api('/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: otherUser.username }),
    })
    if (res.ok) {
      setProfile((prev) => (prev ? { ...prev, friendStatus: 'pending' } : prev))
    }
  }, [otherUser])

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text && !selectedFile) return

    await sendMessageMutation.mutateAsync({
      text,
      file: selectedFile,
      previewUrl,
    })

    setInput('')
    clearSelectedFile()

    useChatsStore.getState().bumpChat(chatPublicId, {
      text: text || (selectedFile ? 'Sent a file' : ''),
      createdAt: new Date().toISOString(),
    })
  }, [chatPublicId, clearSelectedFile, input, previewUrl, selectedFile, sendMessageMutation])

  const handleEditMessage = useCallback(async (messageId: number) => {
    if (!editText.trim()) return
    await api(`/chats/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText }),
      credentials: 'include',
    })
    setEditingId(null)
    setEditText('')
  }, [editText])

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    await api(`/chats/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <ChatHeader
        user={
          isGroup
            ? {
                id: chat?.chatPublicId ?? chatPublicId,
                name: chat?.name ?? 'Group',
                avatar: chat?.avatar ?? null,
              }
            : {
                id: otherUser?.id ?? 'unknown',
                name: otherUser?.name ?? otherUser?.username ?? 'User',
                avatar: otherUser?.avatar ?? null,
                isOnline: otherUser
                  ? onlineUsers.has(otherUser.id) || otherUser.isOnline === true
                  : false,
              }
        }
        leading={
          <button
            onClick={() => router.push('/zone/chat')}
            className="md:hidden rounded-full h-10 w-10 flex items-center justify-center text-zinc-400 transition-colors hover:bg-muted hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to messages"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
        center={
          pinnedMessages.length > 0 ? (
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300 hover:underline"
              onClick={() => setPinnedPanelOpen(true)}
              aria-label="Show pinned messages"
            >
              <Pin className="h-3 w-3" />
              {pinnedMessages.length} pinned
            </button>
          ) : null
        }
        trailing={
          resolvedProfile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              aria-label={isSidebarOpen ? 'Hide details' : 'Show details'}
              onClick={handleToggleSidebar}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          ) : null
        }
        onCall={() => {
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
        callDisabled={!otherUser || !chatPublicId}
        videoDisabled
        moreDisabled={!otherUser || headerActionBusy || isGroup}
        moreMenu={
          !isGroup && otherUser ? (
            <>
              <DropdownMenuItem onClick={removeCurrentFriend} className="cursor-pointer">
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
            </>
          ) : null
        }
      />

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

      <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm lg:hidden">
          {resolvedProfile ? (
            <ChatSidebar
              profile={resolvedProfile}
              canManageFriend={canManageFriend}
              onAddFriend={addFriend}
              onRemoveFriend={removeCurrentFriend}
              onBlock={blockCurrentFriend}
              onViewProfile={handleOpenProfileModal}
              className="w-full border-0 bg-transparent"
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ProfileModal
        profile={resolvedProfile}
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        canManageFriend={canManageFriend}
        onAddFriend={addFriend}
        onRemoveFriend={removeCurrentFriend}
        onBlock={blockCurrentFriend}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex flex-col min-h-0 flex-1">
          <div
            ref={messagesRef}
            dir="ltr"
            className={cn(
              'flex-1 min-h-0 overflow-x-hidden p-4 w-full overscroll-y-contain',
              messages.length === 0 && !messagesLoading ? 'overflow-hidden' : 'overflow-y-auto',
            )}
          >
            {messages.length === 0 && !messagesLoading ? (
              <EmptyChatState
                name={emptyChatName}
                onSelectMessage={(msg) => setInput(msg)}
              />
            ) : (
              <div className="flex flex-col min-h-full justify-end">
                <div ref={topSentinelRef} className="h-1" />

                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isMe = m.senderId === currentUser?.id
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
                                  await handleEditMessage(m.id)
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
                              onClick={() => void togglePinMessage(m.id)}
                              className={cn(
                                "p-1 rounded-md shadow",
                                m.isPinned ? "bg-amber-500 text-black" : "bg-background hover:bg-muted"
                              )}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void handleDeleteMessage(m.id)}
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
                                  await handleEditMessage(m.id)
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
                            onClick={() => void togglePinMessage(m.id)}
                            className={cn(
                              "p-1 rounded-md shadow",
                              m.isPinned ? "bg-amber-500 text-black" : "bg-background hover:bg-muted"
                            )}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteMessage(m.id)}
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
              </div>
            )}
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
                    alt="Preview"
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
                const user = chat?.participants.find((participant) => participant.id === uid)
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
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void send()
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
                    onClick={() => { setShowGifs(!showGifs); setShowStickers(false); setShowEmojis(false); }}
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

                <div className="relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-9 w-9 transition-colors", showEmojis ? "text-primary" : "text-zinc-400 hover:text-zinc-200")}
                    onClick={() => { setShowEmojis(!showEmojis); setShowGifs(false); setShowStickers(false); }}
                    title="Pick an Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  {showEmojis && (
                    <EmojiPicker
                      onClose={() => setShowEmojis(false)}
                      onSelect={(emoji) => {
                        setInput(prev => prev + emoji)
                        inputRef.current?.focus()
                      }}
                    />
                  )}
                </div>

                <div className="relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-9 w-9 transition-colors", showStickers ? "text-primary" : "text-zinc-400 hover:text-zinc-200")}
                    onClick={() => { setShowStickers(!showStickers); setShowGifs(false); setShowEmojis(false); }}
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
                disabled={sendMessageMutation.isPending || (!input.trim() && !selectedFile)}
                onClick={() => void send()}
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
        </div>

        {resolvedProfile && isSidebarOpen ? (
          <div className="hidden lg:flex">
            <ChatSidebar
              profile={resolvedProfile}
              canManageFriend={canManageFriend}
              onAddFriend={addFriend}
              onRemoveFriend={removeCurrentFriend}
              onBlock={blockCurrentFriend}
              onViewProfile={handleOpenProfileModal}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
