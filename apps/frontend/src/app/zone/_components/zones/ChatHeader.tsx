"use client"

import { useEffect, useState, ChangeEvent } from "react"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Input,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  Checkbox
} from "packages/ui"
import { UserPlus, Info } from "lucide-react"
import { getAvatarUrl, api } from "@openchat/lib"
import { useUserStore } from "@/app/stores/user-store"

type Member = {
  id: number
  username: string
  avatar?: string | null
  role: "OWNER" | "ADMIN" | "MEMBER"
}

type Props = {
  name: string
  avatar?: string | null
  zonePublicId: string
  members: Member[]
}

export function ChatHeader({ name, avatar, zonePublicId, members }: Props) {

  const user = useUserStore(s => s.user)

  // -------------------------------
  // Local states
  // -------------------------------
  const [showAddModal, setShowAddModal] = useState(false)
  const [results, setResults] = useState<Member[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [friends, setFriends] = useState<Member[]>([])
  const [zoneName, setZoneName] = useState(name)
  const [updatedAvatar, setUpdatedAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [currentAvatar, setCurrentAvatar] = useState(avatar)

  // -------------------------------
  // Load friends
  // -------------------------------
  useEffect(() => {
    const loadFriends = async () => {
      const res = await api("/friends/list")
      const data = await res.json()
      setFriends(data.friends ?? [])
    }
    loadFriends()
  }, [])

  useEffect(() => {
    if (showAddModal) setResults(friends)
  }, [showAddModal, friends])

  const toggleUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(u => u !== id)
        : [...prev, id]
    )
  }

  const searchUsers = async (q: string) => {
    if (!q) return setResults(friends)
    const res = await api(`/users/search?q=${q}`)
    const data = await res.json()
    setResults(data.users ?? [])
  }

  const addUsers = async () => {
    if (!selectedUsers.length) return
    await api(`/zones/${zonePublicId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selectedUsers }),
      credentials: "include"
    })
    setShowAddModal(false)
    setSelectedUsers([])
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setUpdatedAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  const saveZoneInfo = async () => {
    const formData = new FormData()
    formData.append("name", zoneName)
    if (updatedAvatar) formData.append("avatar", updatedAvatar)

    try {
      const res = await api(`/zones/${zonePublicId}`, {
        method: "PATCH",
        body: formData,
        credentials: "include"
      })
      const data = await res.json()
      if (data.zone) {
        setZoneName(data.zone.name)
        setCurrentAvatar(data.zone.avatar)
        setPreview(null)
        setUpdatedAvatar(null)
      }
    } catch (err) {
      console.error(err)
      console.log("Failed to update zone info", err)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={preview || getAvatarUrl(currentAvatar)} />
            <AvatarFallback>{zoneName?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{zoneName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                <Info className="h-4 w-4" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80">
              <SheetTitle className="mb-4">Zone Info</SheetTitle>

              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={preview || getAvatarUrl(currentAvatar)} />
                  <AvatarFallback>{zoneName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{zoneName}</p>
              </div>

              {/* Change name */}
              <div className="mt-6">
                <Input
                  placeholder="Change zone name"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                />
              </div>

              {/* Change avatar */}
              <div className="mt-3">
                <Input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>

              {/* Save button */}
              <div className="mt-4 flex justify-center">
                <Button onClick={saveZoneInfo}>Save</Button>
              </div>

              {/* Members */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Members</p>
                <div className="space-y-2">
                  {members.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(m.avatar)} />
                          <AvatarFallback>{m.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{m.username}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {m.role.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Add members modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="bg-background p-6 rounded-xl w-96">
            <h2 className="font-bold mb-4">Add Members</h2>

            <Input placeholder="Search users..." onChange={e => searchUsers(e.target.value)} />

            {selectedUsers.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {results
                  .filter(u => selectedUsers.includes(u.id))
                  .map(u => (
                    <Avatar key={u.id} className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(u.avatar)} />
                      <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
              </div>
            )}

            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {results
                .filter(u => u.id !== user?.id)
                .map(u => {
                  const selected = selectedUsers.includes(u.id)
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${selected ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(u.avatar)} />
                          <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{u.username}</span>
                      </div>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                    </div>
                  )
                })}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={addUsers}>Add</Button>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
