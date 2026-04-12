'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    Input,
    Skeleton,
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from 'packages/ui'
import {
    Check,
    Hash,
    Info,
    Link2,
    Menu,
    Plus,
    Send,
    Smile,
    Pin,
    Image,
    MoreHorizontal,
    Pencil,
    Trash2,
    Gift,
} from 'lucide-react'
import { api, getAvatarUrl, socket } from '@openchat/lib'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import MessageText from '../../../../_components/chat/MessageText'
import ZoneSettings from '../../../../_components/zones/ZoneSettings'
import ZoneSidebar from '../../../../_components/ZoneSidebar'
import ZonesList from '../../../../_components/zones/ZonesList'
import GifPicker from '../../../../_components/chat/GifPicker'
import EmojiPicker from '../../../../_components/chat/EmojiPicker'
import { useChatsStore } from '@/app/stores/chat-store'
import {
    useSendChannelMessageMutation,
    useEditChannelMessageMutation,
    useDeleteChannelMessageMutation,
} from '@/features/chat/mutations'
import { useMessages, useChannelPinnedMessages } from '@/features/chat/queries'
import { useChannel } from '@/features/channels/queries'
import { useCreateZoneInviteMutation } from '@/features/zones/mutations'
import { useZone } from '@/features/zones/queries'
import { useUser } from '@/features/user/queries'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'packages/ui'

function getMessageTimestamp(message: { createdAt?: string; id: number }) {
    if (message.createdAt) {
        const parsed = new Date(message.createdAt).getTime()
        if (!Number.isNaN(parsed)) return parsed
    }

    return message.id
}

type ChannelMessage = {
    id: number
    text?: string | null
    fileUrl?: string | null
    fileType?: string | null
    senderId: number
    sender?: { id: number; username: string; avatar?: string | null } | null
    createdAt: string
    isDeleted?: boolean
    isPinned?: boolean
    pinnedAt?: string | null
}

export default function ChannelPage() {
    const { zonePublicId, channelPublicId } = useParams<{
        zonePublicId: string
        channelPublicId: string
    }>()
    const { data: currentUser } = useUser()
    const { data: zone, isLoading: zoneLoading } = useZone(zonePublicId)
    const { data: channel, isLoading: channelLoading } = useChannel(
        zonePublicId,
        channelPublicId
    )
    const { data: messages = [], isLoading: messagesLoading } = useMessages(
        zonePublicId,
        channelPublicId
    )
    const { data: pinnedMessages = [] } = useChannelPinnedMessages(
        zonePublicId,
        channelPublicId
    )
    const sendMessageMutation = useSendChannelMessageMutation(
        zonePublicId,
        channelPublicId
    )
    const editMessageMutation = useEditChannelMessageMutation(
        zonePublicId,
        channelPublicId
    )
    const deleteMessageMutation = useDeleteChannelMessageMutation(
        zonePublicId,
        channelPublicId
    )
    const createZoneInviteMutation = useCreateZoneInviteMutation(zonePublicId)

    const [input, setInput] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [inviteCopied, setInviteCopied] = useState(false)
    const [dashboardOpen, setDashboardOpen] = useState(false)
    const [showGifs, setShowGifs] = useState(false)
    const [showEmojis, setShowEmojis] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editText, setEditText] = useState('')
    const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false)
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())

    const messagesRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const setActiveChat = useChatsStore((state) => state.setActiveChat)
    const setActiveChannel = useChatsStore((state) => state.setActiveChannel)
    const clearUnread = useChatsStore((state) => state.clearUnread)

    useEffect(() => {
        setActiveChat(zonePublicId)
        setActiveChannel(channelPublicId)
        clearUnread(zonePublicId, channelPublicId)

        return () => {
            setActiveChat(null)
            setActiveChannel(null)
        }
    }, [
        channelPublicId,
        clearUnread,
        setActiveChannel,
        setActiveChat,
        zonePublicId,
    ])

    useEffect(() => {
        socket.emit('join-room', {
            chatPublicId: zonePublicId,
            channelPublicId,
        })

        return () => {
            socket.emit('leave-room', {
                chatPublicId: zonePublicId,
                channelPublicId,
            })
        }
    }, [channelPublicId, zonePublicId])

    useEffect(() => {
        const handler = ({
            userId,
            isTyping,
        }: {
            userId: number
            isTyping: boolean
        }) => {
            setTypingUsers((prev) => {
                const next = new Set(prev)
                if (isTyping) next.add(userId)
                else next.delete(userId)
                return next
            })
        }
        socket.on('chat:typing', handler)
        return () => {
            socket.off('chat:typing', handler)
        }
    }, [])

    useEffect(() => {
        if (!messagesRef.current) return

        const container = messagesRef.current
        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight

        if (distanceFromBottom < 160) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: messagesLoading ? 'auto' : 'smooth',
            })
        }
    }, [messages, messagesLoading])

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

    const copyInviteLink = useCallback(async () => {
        const invite = await createZoneInviteMutation.mutateAsync()
        const link = `${window.location.origin}/zone/invite/${invite.code}`

        await navigator.clipboard.writeText(link)
        setInviteCopied(true)
        window.setTimeout(() => setInviteCopied(false), 2000)
    }, [createZoneInviteMutation])

    const send = useCallback(async () => {
        if (!input.trim() && !selectedFile) return

        await sendMessageMutation.mutateAsync({
            text: input,
            file: selectedFile,
            previewUrl,
        })

        setInput('')
        clearSelectedFile()
    }, [
        clearSelectedFile,
        input,
        previewUrl,
        selectedFile,
        sendMessageMutation,
    ])

    const handlePinMessage = useCallback(async (messageId: number) => {
        await api(`/chats/messages/${messageId}/pin`, {
            method: 'PATCH',
            credentials: 'include',
        })
    }, [])

    const handleEditMessage = useCallback(
        async (messageId: number) => {
            if (!editText.trim()) return
            await editMessageMutation.mutateAsync({
                messageId,
                text: editText,
            })
            setEditingId(null)
            setEditText('')
        },
        [editText, editMessageMutation]
    )

    const handleDeleteMessage = useCallback(
        async (messageId: number) => {
            await deleteMessageMutation.mutateAsync(messageId)
        },
        [deleteMessageMutation]
    )

    const startEditing = useCallback(
        (
            message: Omit<ChannelMessage, 'createdAt'> & { createdAt?: string }
        ) => {
            setEditingId(message.id)
            setEditText(message.text || '')
        },
        []
    )

    const emitTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        socket.emit('chat:typing', {
            chatPublicId: zonePublicId,
            channelPublicId,
            isTyping: true,
        })
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat:typing', {
                chatPublicId: zonePublicId,
                channelPublicId,
                isTyping: false,
            })
            typingTimeoutRef.current = null
        }, 3000)
    }, [channelPublicId, zonePublicId])

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [])

    const scrollToMessage = useCallback((messageId: number) => {
        const element = document.getElementById(`message-${messageId}`)
        if (!element) return
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [])

    if (zoneLoading || channelLoading || messagesLoading || !zone || !channel) {
        return (
            <div className="flex h-full min-h-0 flex-col bg-background">
                <div className="h-12 border-b border-border flex items-center px-4 gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex-1 p-4 space-y-6 overflow-hidden">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden md:flex p-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    const currentUserId = currentUser?.id

    return (
        <div className="flex h-full min-h-0 flex-col bg-background">
            <div className="h-12 shrink-0 border-b border-border flex items-center px-4 justify-between shadow-sm bg-background">
                <div className="flex items-center gap-2">
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <Menu className="h-5 w-5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[336px] p-0">
                                <VisuallyHidden>
                                    <SheetTitle>Navigation</SheetTitle>
                                </VisuallyHidden>
                                <div className="flex h-full w-full">
                                    <ZonesList />
                                    <ZoneSidebar user={currentUser ?? null} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    <Hash className="w-5 h-5 text-muted-foreground" />
                    <h1 className="font-bold text-sm tracking-tight">
                        {channel.name}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {pinnedMessages.length > 0 && (
                        <button
                            type="button"
                            className="hidden sm:flex items-center gap-1 text-[11px] text-amber-500 hover:underline"
                            onClick={() => setPinnedPanelOpen(true)}
                        >
                            <Pin className="h-3 w-3" />
                            {pinnedMessages.length} pinned
                        </button>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            void copyInviteLink()
                        }}
                        disabled={createZoneInviteMutation.isPending}
                        className="h-8 w-8"
                        title="Copy invite link"
                    >
                        {inviteCopied ? (
                            <Check size={18} />
                        ) : (
                            <Link2 size={18} />
                        )}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDashboardOpen(true)}
                        className="h-8 w-8"
                    >
                        <Info size={18} />
                    </Button>
                </div>
            </div>

            <Sheet open={pinnedPanelOpen} onOpenChange={setPinnedPanelOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetTitle>Pinned Messages</SheetTitle>
                    <SheetDescription>
                        Quick access to the most important messages in this
                        channel.
                    </SheetDescription>

                    <div className="mt-6 space-y-3">
                        {pinnedMessages.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No pinned messages yet.
                            </p>
                        )}
                        {pinnedMessages.map((m) => (
                            <div
                                key={m.id}
                                className="p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => scrollToMessage(m.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage
                                            src={getAvatarUrl(m.sender?.avatar)}
                                        />
                                        <AvatarFallback className="text-[10px]">
                                            {m.sender?.username[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">
                                        {m.sender?.username}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(
                                            getMessageTimestamp(m)
                                        ).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm mt-1 line-clamp-2">
                                    {m.isDeleted ? (
                                        <span className="italic text-muted-foreground">
                                            Message deleted
                                        </span>
                                    ) : m.text ? (
                                        <MessageText text={m.text} />
                                    ) : m.fileUrl ? (
                                        <span className="text-muted-foreground">
                                            Sent an image
                                        </span>
                                    ) : null}
                                </p>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            {zone && (
                <ZoneSettings
                    zonePublicId={zonePublicId}
                    zoneName={zone.name}
                    zoneAvatar={zone.avatar}
                    open={dashboardOpen}
                    onOpenChange={setDashboardOpen}
                />
            )}

            <div
                ref={messagesRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 space-y-4"
            >
                <div className="flex flex-col min-h-full justify-end">
                    <div className="px-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Hash size={32} />
                        </div>
                        {channel && (
                            <>
                                <h2 className="text-2xl font-bold mb-1">
                                    Welcome to #{channel.name}!
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    This is the start of the #{channel.name}{' '}
                                    channel.
                                </p>
                            </>
                        )}
                        <div className="h-[1px] bg-border w-full my-6" />
                    </div>

                    {messages.map((message, index) => {
                        const previousMessage = messages[index - 1]
                        const isGrouped =
                            !!previousMessage &&
                            previousMessage.senderId === message.senderId &&
                            getMessageTimestamp(message) -
                                getMessageTimestamp(previousMessage) <
                                300000

                        const sender = message.sender || {
                            username: 'User',
                            avatar: null,
                        }
                        const isOwn = message.senderId === currentUserId

                        if (isGrouped) {
                            return (
                                <div
                                    key={message.id}
                                    id={`message-${message.id}`}
                                    className="pl-14 pr-4 py-0.5 hover:bg-muted/30 transition-colors group relative"
                                >
                                    <div className="text-[14px] leading-[1.375rem]">
                                        {message.isDeleted ? (
                                            <span className="italic text-muted-foreground">
                                                Message deleted
                                            </span>
                                        ) : message.text ? (
                                            editingId === message.id ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editText}
                                                        onChange={(e) =>
                                                            setEditText(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-8"
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                handleEditMessage(
                                                                    message.id
                                                                )
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            )
                                                                setEditingId(
                                                                    null
                                                                )
                                                        }}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleEditMessage(
                                                                message.id
                                                            )
                                                        }
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            ) : (
                                                <MessageText
                                                    text={message.text}
                                                />
                                            )
                                        ) : null}
                                    </div>
                                    {message.fileUrl && (
                                        <img
                                            src={message.fileUrl}
                                            className="mt-2 rounded-lg max-h-80 ring-1 ring-border"
                                        />
                                    )}
                                </div>
                            )
                        }

                        return (
                            <div
                                key={message.id}
                                id={`message-${message.id}`}
                                className="flex gap-4 px-4 py-3 hover:bg-muted/30 transition-colors mt-2 group"
                            >
                                <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                                    <AvatarImage
                                        src={getAvatarUrl(sender.avatar)}
                                    />
                                    <AvatarFallback>
                                        {sender.username[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="font-bold text-[15px] hover:underline cursor-pointer">
                                            {sender.username}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {new Date(
                                                getMessageTimestamp(message)
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        {message.isPinned && (
                                            <Pin className="h-3 w-3 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="text-[14px] leading-[1.375rem] whitespace-pre-wrap break-words">
                                        {message.isDeleted ? (
                                            <span className="italic text-muted-foreground">
                                                Message deleted
                                            </span>
                                        ) : editingId === message.id ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    value={editText}
                                                    onChange={(e) =>
                                                        setEditText(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-8"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter')
                                                            handleEditMessage(
                                                                message.id
                                                            )
                                                        if (e.key === 'Escape')
                                                            setEditingId(null)
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleEditMessage(
                                                            message.id
                                                        )
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        ) : message.text ? (
                                            <MessageText text={message.text} />
                                        ) : null}
                                    </div>
                                    {message.fileUrl && (
                                        <img
                                            src={message.fileUrl}
                                            className="mt-2 rounded-lg max-h-80 ring-1 ring-border"
                                        />
                                    )}
                                </div>

                                {!message.isDeleted && isOwn && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        startEditing(message)
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDeleteMessage(
                                                            message.id
                                                        )
                                                    }
                                                    className="cursor-pointer text-red-500 focus:text-red-500"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handlePinMessage(
                                                            message.id
                                                        )
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <Pin className="mr-2 h-4 w-4" />
                                                    {message.isPinned
                                                        ? 'Unpin'
                                                        : 'Pin'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {typingUsers.size > 0 &&
                        Array.from(typingUsers).map((uid) => {
                            const user = messages.find(
                                (m) => m.senderId === uid
                            )?.sender
                            if (!user) return null
                            return (
                                <div key={uid} className="px-4 py-1">
                                    <span className="text-xs text-muted-foreground animate-pulse">
                                        {user.username} is typing...
                                    </span>
                                </div>
                            )
                        })}
                </div>
            </div>

            <div
                className="shrink-0 border-t border-border bg-background/95 px-4 pt-2 safe-bottom backdrop-blur"
                style={{
                    paddingBottom:
                        'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
                }}
            >
                {showGifs && (
                    <div className="mb-2">
                        <GifPicker
                            onSelect={(gifUrl) => {
                                setInput((prev) => prev + gifUrl)
                                setShowGifs(false)
                                inputRef.current?.focus()
                            }}
                            onClose={() => setShowGifs(false)}
                        />
                    </div>
                )}

                {showEmojis && (
                    <div className="mb-2">
                        <EmojiPicker
                            onSelect={(emoji) => {
                                setInput((prev) => prev + emoji)
                                inputRef.current?.focus()
                            }}
                            onClose={() => setShowEmojis(false)}
                        />
                    </div>
                )}

                <div className="bg-muted rounded-lg p-2.5 flex flex-col gap-2 shadow-sm border focus-within:border-primary transition-colors">
                    {previewUrl && (
                        <div className="relative w-24 h-24 mb-2 group">
                            <img
                                src={previewUrl}
                                className="w-full h-full object-cover rounded-md ring-1 ring-border"
                            />
                            <button
                                onClick={clearSelectedFile}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="sr-only">Remove</span>
                                <Plus className="w-3 h-3 rotate-45" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 w-8 shrink-0"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>

                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(event) => {
                                setInput(event.target.value)
                                emitTyping()
                            }}
                            placeholder={`Message #${channel.name}`}
                            className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto text-sm"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault()
                                    void send()
                                }
                            }}
                        />

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowGifs(!showGifs)}
                            className={`h-8 w-8 shrink-0 ${showGifs ? 'bg-muted' : ''}`}
                        >
                            <Gift className="h-5 w-5" />
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setShowEmojis(!showEmojis)}
                            className={`h-8 w-8 shrink-0 ${showEmojis ? 'bg-muted' : ''}`}
                        >
                            <Smile className="h-5 w-5" />
                        </Button>

                        <Button
                            size="icon"
                            disabled={
                                (!input.trim() && !selectedFile) ||
                                sendMessageMutation.isPending
                            }
                            onClick={() => {
                                void send()
                            }}
                            className="h-8 w-8 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return

                        if (previewUrl) {
                            URL.revokeObjectURL(previewUrl)
                        }

                        setSelectedFile(file)
                        setPreviewUrl(URL.createObjectURL(file))
                    }}
                />
                <p className="text-[10px] text-muted-foreground mt-2 px-2">
                    Press Enter to send. Use Shift+Enter for new line.
                </p>
            </div>
        </div>
    )
}
