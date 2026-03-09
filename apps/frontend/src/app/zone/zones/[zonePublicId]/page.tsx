'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "packages/ui"
import { Info, Paperclip, Send } from "lucide-react"
import { api, socket, getAvatarUrl } from "@openchat/lib"
import { ChatHeader } from "../../_components/zones/ChatHeader"

type Message = {
  id: number
  text: string | null
  senderId: number
  sender?: {
    id: number
    username: string
    avatar?: string | null
  }
  fileUrl?: string
  fileType?: string
  isDeleted?: boolean
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

export default function ZonePage() {
  const { zonePublicId } = useParams<{ zonePublicId: string }>()
  const [zone, setZone] = useState<Zone | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [user, setUser] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [results, setResults] = useState<Member[]>([])

  const messagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userCache = useRef<Map<number, Member>>(new Map())

  useEffect(() => {
    const loadMe = async () => {
      const res = await api("/auth/me", { credentials: "include" })
      const data = await res.json()
      setCurrentUserId(data.user.id)
      setUser(data.user)
      userCache.current.set(data.user.id, data.user)
    }
    loadMe()
  }, [])

  // Load zone, messages, members
  useEffect(() => {
    if (!zonePublicId) return

    const loadZone = async () => {
      try {
        // Zones
        const zonesRes = await api("/zones")
        const zonesData = await zonesRes.json()
        const current = zonesData.zones.find((z: Zone) => z.publicId === zonePublicId)
        setZone(current)

        // Messages
        const msgsRes = await api(`/chats/${zonePublicId}/messages`)
        const msgsData = await msgsRes.json()
        const sortedMessages = (msgsData.messages ?? []).sort((a: Message, b: Message) => a.id - b.id)

        setMessages(sortedMessages)

        // Members
        const membersRes = await api(`/zones/${zonePublicId}/members`)
        const membersData = await membersRes.json()
        setMembers(membersData.members ?? [])

        // cache members
        membersData.members?.forEach((m: Member) => {
          userCache.current.set(m.id, m)
        })

      } catch (err) {
        console.error("Failed to load zone data", err)
      }
    }

    loadZone()
  }, [zonePublicId])

  // Join socket room
  useEffect(() => {
    if (!zonePublicId) return
    socket.emit("chat:join", zonePublicId)
    return () => {
      socket.emit("chat:leave", zonePublicId)
    }
  }, [zonePublicId])

  // Listen messages
  useEffect(() => {
    const handler = async (msg: Message & { chatPublicId: string }) => {
      if (msg.chatPublicId !== zonePublicId) return
      // Placeholder sender
      const cached = userCache.current.get(msg.senderId)
      const sender = msg.sender || cached || { id: msg.senderId, username: "Loading...", avatar: null }

      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, sender }])

      // Fetch sender if missing
      if (!cached) {
        try {
          const res = await api(`/users/${msg.senderId}`)
          const data = await res.json()
          userCache.current.set(msg.senderId, data.user)
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sender: data.user } : m))
        } catch (err) {
          console.error("Failed to fetch sender", err)
        }
      }
    }

    socket.on("private-message", handler)
    return () => {
      socket.off("private-message", handler)
    }
  }, [zonePublicId])

  // Auto scroll
  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages])

  // Send message
  const send = useCallback(async () => {
    if (!zonePublicId) return
    if (!input.trim() && !selectedFile) return

    const tempId = Date.now()
    setMessages(prev => [
      ...prev,
      {
        id: tempId,
        text: input || null,
        senderId: currentUserId!,
        fileUrl: previewUrl ?? undefined,
        fileType: selectedFile?.type,
        sender: userCache.current.get(currentUserId!) || user
      }
    ])

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
      { chatPublicId: zonePublicId, text: input || null, fileUrl, fileType },
      (savedMessage: Message) => {
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m))
      }
    )

    setInput("")
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }, [input, selectedFile, previewUrl, zonePublicId, currentUserId, user])

  if (!zone) return <div className="flex items-center justify-center h-[100svh]">Loading...</div>

  return (
    <div className="flex flex-col h-[100svh]">

      {/* Header */}
      <ChatHeader
        name={zone.name}
        avatar={zone.avatar}
        zonePublicId={zone.publicId}
        members={members}
      />

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3 min-h-full justify-end">
          {messages.map(m => {
            const isMe = m.senderId === currentUserId
            const sender = m.sender || userCache.current.get(m.senderId) || { username: "Loading...", avatar: null }

            return (
              <div key={m.id} className={`flex gap-3 mb-4 ${isMe ? "justify-end" : ""}`}>
                {!isMe && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(sender.avatar)} />
                    <AvatarFallback>{sender.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}

                <div className="max-w-[70%]">
                  {!isMe && <p className="text-xs text-muted-foreground mb-1">{sender.username}</p>}
                  <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.isDeleted ? "Message deleted" : m.text}
                  </div>
                  {m.fileUrl && <img src={m.fileUrl} className="mt-2 rounded-lg max-h-60" />}
                </div>

                {isMe && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(user?.avatar)} />
                    <AvatarFallback>{user?.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 flex gap-2 border">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type message..."
          onKeyDown={e => e.key === "Enter" && send()}
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            setSelectedFile(f)
            setPreviewUrl(URL.createObjectURL(f))
          }}
        />

        <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
          <Paperclip />
        </Button>

        <Button size="icon" disabled={!input.trim() && !selectedFile} onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-background p-6 rounded-xl w-80">
            <h2 className="font-bold mb-4">Add User</h2>
            <Input placeholder="Search username..." onChange={e => {
              if (!e.target.value) return setResults([])
              api(`/users/search?q=${e.target.value}`).then(res => res.json()).then(data => setResults(data.users ?? []))
            }} />
            <div className="mt-3 space-y-2">
              {results.map(u => (
                <div key={u.id} className="cursor-pointer hover:bg-muted p-2 rounded" onClick={() => {
                  api(`/zones/${zonePublicId}/members`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: u.id }),
                    credentials: "include"
                  }).then(() => setMembers(prev => [...prev, u]))
                  setShowAddModal(false)
                }}>
                  {u.username}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
