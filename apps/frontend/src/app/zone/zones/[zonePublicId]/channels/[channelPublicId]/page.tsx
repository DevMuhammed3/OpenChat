'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Skeleton, Sheet, SheetContent, SheetTitle, SheetTrigger } from "packages/ui"
import { Check, Hash, Info, Link2, Menu, Plus, Send } from "lucide-react"
import { getAvatarUrl, socket } from "@openchat/lib"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import MessageText from "../../../../_components/chat/MessageText"
import ZoneDashboardSheet from "../../../../_components/zones/ZoneDashboardSheet"
import ZoneSidebar from "../../../../_components/ZoneSidebar"
import ZonesList from "../../../../_components/zones/ZonesList"
import { useChatsStore } from "@/app/stores/chat-store"
import { useSendChannelMessageMutation } from "@/features/chat/mutations"
import { useMessages } from "@/features/chat/queries"
import { useChannel } from "@/features/channels/queries"
import { useCreateZoneInviteMutation } from "@/features/zones/mutations"
import { useZone } from "@/features/zones/queries"
import { useUser } from "@/features/user/queries"

function getMessageTimestamp(message: { createdAt?: string; id: number }) {
  if (message.createdAt) {
    const parsed = new Date(message.createdAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }

  return message.id
}

export default function ChannelPage() {
  const { zonePublicId, channelPublicId } = useParams<{ zonePublicId: string; channelPublicId: string }>()
  const { data: currentUser } = useUser()
  const { data: zone, isLoading: zoneLoading } = useZone(zonePublicId)
  const { data: channel, isLoading: channelLoading } = useChannel(zonePublicId, channelPublicId)
  const { data: messages = [], isLoading: messagesLoading } = useMessages(zonePublicId, channelPublicId)
  const sendMessageMutation = useSendChannelMessageMutation(zonePublicId, channelPublicId)
  const createZoneInviteMutation = useCreateZoneInviteMutation(zonePublicId)

  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  }, [channelPublicId, clearUnread, setActiveChannel, setActiveChat, zonePublicId])

  useEffect(() => {
    socket.emit("join-room", { chatPublicId: zonePublicId, channelPublicId })

    return () => {
      socket.emit("leave-room", { chatPublicId: zonePublicId, channelPublicId })
    }
  }, [channelPublicId, zonePublicId])

  useEffect(() => {
    if (!messagesRef.current) return

    const container = messagesRef.current
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight

    if (distanceFromBottom < 160) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: messagesLoading ? "auto" : "smooth",
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
      fileInputRef.current.value = ""
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

    setInput("")
    clearSelectedFile()
  }, [clearSelectedFile, input, previewUrl, selectedFile, sendMessageMutation])

  if (zoneLoading || channelLoading || messagesLoading || !zone || !channel) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="h-12 shrink-0 border-b border-white/5 flex items-center px-4 justify-between shadow-sm bg-background">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-white">
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
          <Hash className="w-5 h-5 text-zinc-500" />
          <h1 className="font-bold text-sm tracking-tight">{channel.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              void copyInviteLink()
            }}
            disabled={createZoneInviteMutation.isPending}
            className="h-8 w-8 text-zinc-400 hover:text-white transition-colors"
            title="Copy invite link"
          >
            {inviteCopied ? <Check size={18} /> : <Link2 size={18} />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDashboardOpen(true)}
            className="h-8 w-8 text-zinc-400 hover:text-white transition-colors"
          >
            <Info size={18} />
          </Button>
        </div>
      </div>

      {zone && (
        <ZoneDashboardSheet
          zonePublicId={zonePublicId}
          zoneName={zone.name}
          zoneAvatar={zone.avatar}
          open={dashboardOpen}
          onOpenChange={setDashboardOpen}
        />
      )}

      <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 space-y-4">
        <div className="flex flex-col min-h-full justify-end">
          <div className="mb-8 px-4">
            <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mb-4">
              <Hash size={32} className="text-white" />
            </div>
            {channel && (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome to #{channel.name}!</h2>
                <p className="text-zinc-400 text-sm">This is the start of the #{channel.name} channel.</p>
              </>
            )}
            <div className="h-[1px] bg-white/5 w-full my-6" />
          </div>

          {messages.map((message, index) => {
            const previousMessage = messages[index - 1]
            const isGrouped = !!previousMessage &&
              previousMessage.senderId === message.senderId &&
              getMessageTimestamp(message) - getMessageTimestamp(previousMessage) < 300000

            const sender = message.sender || { username: "User", avatar: null }

            if (isGrouped) {
              return (
                <div key={message.id} className="pl-14 pr-4 py-0.5 hover:bg-white/[0.02] transition-colors group relative">
                  <div className="text-[14px] text-zinc-300 leading-[1.375rem]">
                    {message.isDeleted ? <span className="text-zinc-500 italic">Message deleted</span> : message.text ? <MessageText text={message.text} /> : null}
                  </div>
                  {message.fileUrl && <img src={message.fileUrl} className="mt-2 rounded-lg max-h-80 ring-1 ring-white/10" />}
                </div>
              )
            }

            return (
              <div key={message.id} className="flex gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors mt-2">
                <Avatar className="h-10 w-10 shrink-0 mt-0.5 ring-1 ring-white/5">
                  <AvatarImage src={getAvatarUrl(sender.avatar)} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{sender.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">{sender.username}</span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(getMessageTimestamp(message)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[14px] text-zinc-300 leading-[1.375rem] whitespace-pre-wrap break-words">
                    {message.isDeleted ? <span className="text-zinc-500 italic">Message deleted</span> : message.text ? <MessageText text={message.text} /> : null}
                  </div>
                  {message.fileUrl && <img src={message.fileUrl} className="mt-2 rounded-lg max-h-80 ring-1 ring-white/10" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/5 bg-background/95 px-4 pt-2 safe-bottom backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        <div className="bg-white/[0.04] rounded-lg p-2.5 flex flex-col gap-2 shadow-lg ring-1 ring-white/5 focus-within:ring-white/10 transition-shadow">
          {previewUrl && (
            <div className="relative w-24 h-24 mb-2 group">
              <img src={previewUrl} className="w-full h-full object-cover rounded-md ring-1 ring-white/10" />
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
              className="h-8 w-8 text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Message #${channel.name}`}
              className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto text-sm placeholder:text-zinc-500 text-zinc-200"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
            />

            <Button
              size="icon"
              disabled={(!input.trim() && !selectedFile) || sendMessageMutation.isPending}
              onClick={() => {
                void send()
              }}
              className="h-8 w-8 shrink-0 bg-primary/20 hover:bg-primary/40 text-primary transition-colors"
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
        <p className="text-[10px] text-zinc-500 mt-2 px-2">
          Press Enter to send. Use Shift+Enter for new line.
        </p>
      </div>
    </div>
  )
}
