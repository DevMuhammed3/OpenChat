'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from 'packages/ui'
import { api, getAvatarUrl, socket } from '@openchat/lib'
import { useUserStore } from '@/app/stores/user-store'

type Member = {
  id: number
  username: string
  avatar?: string | null
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

type Friend = {
  id: number
  username: string
  avatar?: string | null
}

type Channel = {
  publicId: string
  name: string
  type: 'TEXT' | 'VOICE'
}

export default function ZoneDashboardSheet({
  zonePublicId,
  zoneName,
  zoneAvatar,
  open,
  onOpenChange,
  onZoneUpdated,
}: {
  zonePublicId: string
  zoneName: string
  zoneAvatar?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onZoneUpdated?: (zone: { name: string; avatar: string | null }) => void
}) {
  const currentUser = useUserStore((state) => state.user)
  const [members, setMembers] = useState<Member[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [draftZoneName, setDraftZoneName] = useState(zoneName)
  const [draftZoneAvatar, setDraftZoneAvatar] = useState<string | null>(zoneAvatar ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [savingZone, setSavingZone] = useState(false)
  const [sendingInviteFor, setSendingInviteFor] = useState<number | 'general' | null>(null)
  const [sentInviteFor, setSentInviteFor] = useState<number | 'general' | null>(null)

  useEffect(() => {
    setDraftZoneName(zoneName)
  }, [zoneName])

  useEffect(() => {
    setDraftZoneAvatar(zoneAvatar ?? null)
  }, [zoneAvatar])

  const loadMembers = useCallback(async () => {
    const res = await api(`/zones/${zonePublicId}/members`)
    const data = await res.json()
    setMembers(data.members ?? [])
  }, [zonePublicId])

  const loadChannels = useCallback(async () => {
    const res = await api(`/zones/${zonePublicId}/channels`)
    const data = await res.json()
    setChannels(data.channels ?? [])
  }, [zonePublicId])

  const loadFriends = useCallback(async () => {
    const res = await api('/friends/list')
    const data = await res.json()
    setFriends(data.friends ?? [])
  }, [])

  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(() => {
      void loadMembers()
      void loadChannels()
      void loadFriends()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadChannels, loadFriends, loadMembers, open])

  useEffect(() => {
    if (!zonePublicId) return

    const handleMembersUpdated = (payload: { chatPublicId: string; members: Member[] }) => {
      if (payload.chatPublicId !== zonePublicId) return
      setMembers(payload.members)
    }

    const handleChannelsUpdated = (payload: { chatPublicId: string }) => {
      if (payload.chatPublicId !== zonePublicId) return
      void loadChannels()
    }

    const handleZoneUpdated = (payload: {
      zone: {
        publicId: string
        name: string
        avatar: string | null
      }
    }) => {
      if (payload.zone.publicId !== zonePublicId) return
      setDraftZoneName(payload.zone.name)
      setDraftZoneAvatar(payload.zone.avatar)
      setAvatarFile(null)
      onZoneUpdated?.({ name: payload.zone.name, avatar: payload.zone.avatar })
    }

    socket.on('zone:members-updated', handleMembersUpdated)
    socket.on('zone:channels-updated', handleChannelsUpdated)
    socket.on('zone:updated', handleZoneUpdated)

    return () => {
      socket.off('zone:members-updated', handleMembersUpdated)
      socket.off('zone:channels-updated', handleChannelsUpdated)
      socket.off('zone:updated', handleZoneUpdated)
    }
  }, [loadChannels, onZoneUpdated, zonePublicId])

  const myMembership = useMemo(
    () => members.find((member) => member.id === currentUser?.id) ?? null,
    [currentUser?.id, members],
  )

  const manageableFriends = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id))
    return friends.filter((friend) => !memberIds.has(friend.id))
  }, [friends, members])

  const filteredFriends = useMemo(() => {
    const query = inviteSearch.trim().toLowerCase()
    if (!query) return manageableFriends
    return manageableFriends.filter((friend) => friend.username.toLowerCase().includes(query))
  }, [inviteSearch, manageableFriends])

  const canManageMembers = myMembership?.role === 'OWNER' || myMembership?.role === 'ADMIN'
  const canManageRoles = myMembership?.role === 'OWNER'
  const canCreateChannels = canManageMembers
  const canManageZoneInfo = canManageMembers

  const updateZoneInfo = async () => {
    const nextName = draftZoneName.trim()
    if (!canManageZoneInfo || (!nextName && !avatarFile)) return

    const formData = new FormData()
    if (nextName) {
      formData.append('name', nextName)
    }
    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    setSavingZone(true)

    try {
      const res = await api(`/zones/${zonePublicId}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update zone')
      }

      setDraftZoneName(data.zone.name)
      setDraftZoneAvatar(data.zone.avatar)
      setAvatarFile(null)
      onZoneUpdated?.({ name: data.zone.name, avatar: data.zone.avatar })
    } finally {
      setSavingZone(false)
    }
  }

  const removeMember = async (userId: number) => {
    await api(`/zones/${zonePublicId}/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  }

  const updateRole = async (userId: number, role: 'ADMIN' | 'MEMBER') => {
    await api(`/zones/${zonePublicId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
      credentials: 'include',
    })
  }

  const createChannel = async () => {
    if (!newChannelName.trim()) return

    await api(`/zones/${zonePublicId}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChannelName, type: newChannelType }),
      credentials: 'include',
    })

    setNewChannelName('')
  }

  const createInviteLink = async () => {
    const res = await api(`/zones/${zonePublicId}/invites`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = await res.json()

    if (!res.ok || !data?.invite?.code) {
      throw new Error(data.message || 'Failed to create invite')
    }

    return `${window.location.origin}/zone/invite/${data.invite.code}`
  }

  const copyInviteLink = async (target: 'general') => {
    setSendingInviteFor(target)

    try {
      const link = await createInviteLink()
      await navigator.clipboard.writeText(link)
      setSentInviteFor(target)
      window.setTimeout(() => {
        setSentInviteFor((current) => (current === target ? null : current))
      }, 2000)
    } finally {
      setSendingInviteFor(null)
    }
  }

  const sendInviteToFriend = async (friend: Friend) => {
    setSendingInviteFor(friend.id)

    try {
      const link = await createInviteLink()
      const chatRes = await api('/chats/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: friend.id }),
        credentials: 'include',
      })
      const chatData = await chatRes.json()

      if (!chatRes.ok || !chatData?.chatPublicId) {
        throw new Error(chatData.message || 'Failed to open direct message')
      }

      socket.emit('join-room', { chatPublicId: chatData.chatPublicId })
      socket.emit('private-message', {
        chatPublicId: chatData.chatPublicId,
        text: `Join my zone: ${link}`,
      })

      setSentInviteFor(friend.id)
      window.setTimeout(() => {
        setSentInviteFor((current) => (current === friend.id ? null : current))
      }, 2000)
    } finally {
      setSendingInviteFor(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-white/10 bg-[#0f172a] text-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{zoneName} Dashboard</SheetTitle>
          <SheetDescription>
            Manage channels, members, and permissions in real time.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {canManageZoneInfo && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Zone Profile</h3>
                <p className="text-sm text-zinc-500">Rename the zone or upload a new icon.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-1 ring-white/10">
                    <AvatarImage src={getAvatarUrl(draftZoneAvatar)} />
                    <AvatarFallback className="bg-white/10 text-zinc-100">
                      {draftZoneName?.[0]?.toUpperCase() ?? '#'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <Input
                      value={draftZoneName}
                      onChange={(event) => setDraftZoneName(event.target.value)}
                      placeholder="Zone name"
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      className="border-white/10 bg-white/[0.04] text-white"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setAvatarFile(file)
                        if (file) {
                          setDraftZoneAvatar(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button onClick={updateZoneInfo} disabled={savingZone}>
                    Save zone
                  </Button>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Channels</h3>
              <p className="text-sm text-zinc-500">All rooms in this zone update live.</p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              {channels.map((channel) => (
                <div key={channel.publicId} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className="font-medium text-zinc-100">#{channel.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{channel.type}</span>
                </div>
              ))}
            </div>

            {canCreateChannels && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-3 text-sm font-medium text-zinc-200">Create channel</p>
                <div className="flex gap-2">
                  <Input
                    value={newChannelName}
                    onChange={(event) => setNewChannelName(event.target.value)}
                    placeholder="new-room"
                    className="border-white/10 bg-white/[0.04] text-white"
                  />
                  <select
                    value={newChannelType}
                    onChange={(event) => setNewChannelType(event.target.value as 'TEXT' | 'VOICE')}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white"
                  >
                    <option value="TEXT">Text</option>
                    <option value="VOICE">Voice</option>
                  </select>
                  <Button onClick={createChannel}>Create</Button>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Members</h3>
              <p className="text-sm text-zinc-500">Change roles or remove members from the zone.</p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              {members.map((member) => {
                const canRemove =
                  canManageMembers &&
                  member.id !== currentUser?.id &&
                  member.role !== 'OWNER' &&
                  !(myMembership?.role === 'ADMIN' && member.role === 'ADMIN')

                const canEditRole =
                  canManageRoles &&
                  member.id !== currentUser?.id &&
                  member.role !== 'OWNER'

                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                    <Avatar className="h-10 w-10 ring-1 ring-white/10">
                      <AvatarImage src={getAvatarUrl(member.avatar)} />
                      <AvatarFallback className="bg-white/10 text-zinc-100">
                        {member.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-100">{member.username}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{member.role}</p>
                    </div>

                    {canEditRole ? (
                      <select
                        value={member.role}
                        onChange={(event) => updateRole(member.id, event.target.value as 'ADMIN' | 'MEMBER')}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    ) : (
                      <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-400">
                        {member.role}
                      </div>
                    )}

                    {canRemove && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {canManageMembers && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Invite By Link</h3>
                <p className="text-sm text-zinc-500">Nobody gets added directly. They have to open the invite link and join themselves.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">General invite link</p>
                    <p className="text-xs text-zinc-500">Copy it and send it anywhere in DM.</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyInviteLink('general')}
                    disabled={sendingInviteFor === 'general'}
                  >
                    {sentInviteFor === 'general' ? 'Copied' : 'Copy Link'}
                  </Button>
                </div>

                <Input
                  value={inviteSearch}
                  onChange={(event) => setInviteSearch(event.target.value)}
                  placeholder="Search friends..."
                  className="mb-3 border-white/10 bg-white/[0.04] text-white"
                />

                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                      <Avatar className="h-9 w-9 ring-1 ring-white/10">
                        <AvatarImage src={getAvatarUrl(friend.avatar)} />
                        <AvatarFallback className="bg-white/10 text-zinc-100">
                          {friend.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm font-medium text-zinc-100">{friend.username}</span>
                      <Button
                        size="sm"
                        onClick={() => sendInviteToFriend(friend)}
                        disabled={sendingInviteFor === friend.id}
                      >
                        {sentInviteFor === friend.id ? 'Sent' : 'Send Invite'}
                      </Button>
                    </div>
                  ))}

                  {filteredFriends.length === 0 && (
                    <p className="py-6 text-center text-sm text-zinc-500">
                      No available friends to add.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
