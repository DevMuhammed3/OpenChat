'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage, Button, Input, Skeleton } from "packages/ui"
import { Info, Send, Hash, Plus, Link2, Check } from "lucide-react"
import { api, socket, getAvatarUrl } from "@openchat/lib"
import { useChatsStore } from "@/app/stores/chat-store"
import MessageText from "../../../../_components/chat/MessageText"
import ZoneDashboardSheet from "../../../../_components/zones/ZoneDashboardSheet"

type Message = {
  id: number
  text: string | null
  senderId: number
  sender?: ChannelUser
  fileUrl?: string | null
  fileType?: string | null
  isDeleted?: boolean
  createdAt?: string
}

type ChannelUser = {
  id: number
  username: string
  avatar?: string | null
}

type Zone = {
  publicId: string
  name: string
  avatar: string | null
}

type Member = {
  id: number
  username: string
  avatar?: string | null
  role: "OWNER" | "ADMIN" | "MEMBER"
}

type Channel = {
  publicId: string
  name: string
  type: "TEXT" | "VOICE"
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

export default function ChannelPage() {
  const { zonePublicId, channelPublicId } = useParams<{ zonePublicId: string; channelPublicId: string }>()
  const [zone, setZone] = useState<Zone | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<ChannelUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const messagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userCache = useRef<Map<number, ChannelUser>>(new Map())

  const setActiveChat = useChatsStore(s => s.setActiveChat)
  const setActiveChannel = useChatsStore(s => s.setActiveChannel)
  const clearUnread = useChatsStore(s => s.clearUnread)

  useEffect(() => {
    const loadMe = async () => {
      const res = await api("/auth/me", { credentials: "include" })
      const data = await res.json()
      setCurrentUserId(data.user.id)
      setUser(data.user)
      userCache.current.set(data.user.id, data.user)
    }
    loadMe()
    
    setActiveChat(zonePublicId)
    setActiveChannel(channelPublicId)
    clearUnread(zonePublicId, channelPublicId)
    
    return () => {
      setActiveChat(null)
      setActiveChannel(null)
    }
  }, [zonePublicId, channelPublicId, setActiveChat, setActiveChannel, clearUnread])

  // Load zone, channel, messages, members
  useEffect(() => {
    if (!zonePublicId || !channelPublicId) return

    const loadData = async () => {
      try {
        // Zone
        const zonesRes = await api("/zones")
        const zonesData = await zonesRes.json()
        const zones = Array.isArray(zonesData?.zones) ? zonesData.zones : []
        const currentZone = zones.find((z: Zone) => z.publicId === zonePublicId)
        setZone(currentZone)

        // Channels
        const channelsRes = await api(`/zones/${zonePublicId}/channels`)
        const channelsData = await channelsRes.json()
        const channels = Array.isArray(channelsData?.channels) ? channelsData.channels : []
        const currentChannel = channels.find((c: Channel) => c.publicId === channelPublicId)
        setChannel(currentChannel)

        // Messages
        const msgsRes = await api(`/chats/${zonePublicId}/messages?channelPublicId=${channelPublicId}`)
        const msgsData = await msgsRes.json()
        setMessages(sortMessages(msgsData.messages ?? []))

        // Members
        const membersRes = await api(`/zones/${zonePublicId}/members`)
        const membersData = await membersRes.json()
        membersData.members?.forEach((m: Member) => {
          userCache.current.set(m.id, m)
        })

      } catch (err) {
        console.error("Failed to load channel data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [zonePublicId, channelPublicId])

  useEffect(() => {
    if (!zonePublicId) return

    const handleZoneUpdated = (payload: { zone: Zone }) => {
      if (payload.zone.publicId !== zonePublicId) return
      setZone(payload.zone)
    }

    const handleChannelsUpdated = async (payload: { chatPublicId: string }) => {
      if (payload.chatPublicId !== zonePublicId) return

      const channelsRes = await api(`/zones/${zonePublicId}/channels`)
      const channelsData = await channelsRes.json()
      const channels = Array.isArray(channelsData?.channels) ? channelsData.channels : []
      const currentChannel = channels.find((item: Channel) => item.publicId === channelPublicId)
      if (currentChannel) {
        setChannel(currentChannel)
      }
    }

    socket.on("zone:updated", handleZoneUpdated)
    socket.on("zone:channels-updated", handleChannelsUpdated)
    return () => {
      socket.off("zone:updated", handleZoneUpdated)
      socket.off("zone:channels-updated", handleChannelsUpdated)
    }
  }, [channelPublicId, zonePublicId])

  // Join/Leave channel room
  useEffect(() => {
    if (!zonePublicId || !channelPublicId) return
    
    socket.emit("join-room", { chatPublicId: zonePublicId, channelPublicId })
    
    return () => {
      socket.emit("leave-room", { chatPublicId: zonePublicId, channelPublicId })
    }
  }, [zonePublicId, channelPublicId])

  // Listen messages
  useEffect(() => {
    const handler = (msg: Message & { chatPublicId: string; channelPublicId?: string }) => {
      if (msg.chatPublicId !== zonePublicId || msg.channelPublicId !== channelPublicId) return
      
      const cached = userCache.current.get(msg.senderId)
      const sender = msg.sender || cached || { id: msg.senderId, username: "User", avatar: null }

      setMessages(prev => mergeMessage(prev, { ...msg, sender }))
    }

    socket.on("private-message", handler)
    return () => {
      socket.off("private-message", handler)
    }
  }, [zonePublicId, channelPublicId])

  // Auto scroll
  useEffect(() => {
    if (!messagesRef.current) return

    const container = messagesRef.current
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight

    if (distanceFromBottom < 160) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: loading ? "auto" : "smooth",
      })
    }
  }, [loading, messages])

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
    if (!zonePublicId) return

    try {
      setCreatingInvite(true)
      const res = await api(`/zones/${zonePublicId}/invites`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()

      if (!data?.invite?.code) {
        throw new Error("Invite code not returned")
      }

      const link = `${window.location.origin}/zone/invite/${data.invite.code}`
      await navigator.clipboard.writeText(link)
      setInviteCopied(true)
      window.setTimeout(() => setInviteCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy invite", err)
    } finally {
      setCreatingInvite(false)
    }
  }, [zonePublicId])

  // Send message
  const send = useCallback(async () => {
    if (!zonePublicId || !channelPublicId) return
    const text = input.trim()
    if (!text && !selectedFile) return

    const tempId = Date.now()
    const tempMsg: Message = {
      id: tempId,
      text: text || null,
      senderId: currentUserId!,
      fileUrl: previewUrl ?? undefined,
      fileType: selectedFile?.type,
      sender: userCache.current.get(currentUserId!) || user || undefined,
      createdAt: new Date().toISOString(),
    }
    
    setMessages(prev => mergeMessage(prev, tempMsg))

    try {
      let fileUrl: string | null = null
      let fileType: string | null = null

      if (selectedFile) {
        const form = new FormData()
        form.append("file", selectedFile)
        const res = await api(`/zones/${zonePublicId}/upload`, {
          method: "POST",
          body: form,
          credentials: "include"
        })
        const data = await res.json()
        fileUrl = data.fileUrl
        fileType = selectedFile.type
      }

      socket.emit(
        "private-message",
        { 
          chatPublicId: zonePublicId, 
          channelPublicId,
          text: text || null, 
          fileUrl, 
          fileType 
        },
        (savedMessage: Message) => {
          setMessages(prev => {
            const withoutOptimistic = prev.filter(message => message.id !== tempId)
            return mergeMessage(withoutOptimistic, savedMessage)
          })
        }
      )

      setInput("")
      clearSelectedFile()
    } catch (err) {
      setMessages(prev => prev.filter(message => message.id !== tempId))
      console.error("Failed to send channel message", err)
    }
  }, [channelPublicId, clearSelectedFile, currentUserId, input, previewUrl, selectedFile, user, zonePublicId])

  if (loading || !zone || !channel) {
    return (
      <div className="flex flex-col h-[100svh] bg-[#0b1220]">
        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
           <Skeleton className="h-5 w-5 rounded-full" />
           <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-6 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
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
    <div className="flex flex-col h-[100svh] bg-[#0b1220]">

      {/* Header */}
      <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-zinc-500" />
          <h1 className="font-bold text-sm tracking-tight">{channel.name}</h1>
        </div>
        <div className="flex items-center gap-4">
           <Button
             size="icon"
             variant="ghost"
             onClick={copyInviteLink}
             disabled={creatingInvite}
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

      <ZoneDashboardSheet
        zonePublicId={zonePublicId}
        zoneName={zone.name}
        zoneAvatar={zone.avatar}
        open={dashboardOpen}
        onOpenChange={setDashboardOpen}
        onZoneUpdated={(nextZone) => {
          setZone((prev) => (prev ? { ...prev, ...nextZone } : prev))
        }}
      />

      {/* Messages Area */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-col min-h-full justify-end">
          {/* Welcome Message */}
          <div className="mb-8 px-4">
             <div className="w-16 h-16 bg-[#1b253b] rounded-full flex items-center justify-center mb-4">
               <Hash size={32} className="text-white" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-1">Welcome to #{channel.name}!</h2>
             <p className="text-zinc-400 text-sm">This is the start of the #{channel.name} channel.</p>
             <div className="h-[1px] bg-white/5 w-full my-6" />
          </div>

          {messages.map((m, idx) => {
            const prevMsg = messages[idx - 1]
            const isGrouped = !!prevMsg && prevMsg.senderId === m.senderId &&
              (getMessageTimestamp(m) - getMessageTimestamp(prevMsg) < 300000)

            const sender = m.sender || { username: "User", avatar: null }

            if (isGrouped) {
              return (
                <div key={m.id} className="pl-14 pr-4 py-0.5 hover:bg-white/[0.02] transition-colors group relative">
                   <div className="text-[14px] text-zinc-300 leading-[1.375rem]">
                      {m.isDeleted ? <span className="text-zinc-500 italic">Message deleted</span> : m.text ? <MessageText text={m.text} /> : null}
                   </div>
                   {m.fileUrl && <img src={m.fileUrl} className="mt-2 rounded-lg max-h-80 ring-1 ring-white/10" />}
                </div>
              )
            }

            return (
              <div key={m.id} className="flex gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors mt-2">
                <Avatar className="h-10 w-10 shrink-0 mt-0.5 ring-1 ring-white/5">
                  <AvatarImage src={getAvatarUrl(sender.avatar)} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{sender.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-[15px] text-white hover:underline cursor-pointer">{sender.username}</span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(getMessageTimestamp(m)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[14px] text-zinc-300 leading-[1.375rem] whitespace-pre-wrap break-words">
                    {m.isDeleted ? <span className="text-zinc-500 italic">Message deleted</span> : m.text ? <MessageText text={m.text} /> : null}
                  </div>
                  {m.fileUrl && <img src={m.fileUrl} className="mt-2 rounded-lg max-h-80 ring-1 ring-white/10" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2">
        <div className="bg-[#1b253b] rounded-lg p-2.5 flex flex-col gap-2 shadow-lg ring-1 ring-white/5 focus-within:ring-white/10 transition-shadow">
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
              onChange={e => setInput(e.target.value)}
              placeholder={`Message #${channel.name}`}
              className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto text-sm placeholder:text-zinc-500 text-zinc-200"
              onKeyDown={e => {
                if(e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <Button 
              size="icon" 
              disabled={!input.trim() && !selectedFile} 
              onClick={send}
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
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl)
            }
            setSelectedFile(f)
            setPreviewUrl(URL.createObjectURL(f))
          }}
        />
        <p className="text-[10px] text-zinc-500 mt-2 px-2">
          Press Enter to send. Use Shift+Enter for new line.
        </p>
      </div>

    </div>
  )
}
