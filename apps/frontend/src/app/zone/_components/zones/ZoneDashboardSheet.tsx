'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { getAvatarUrl, socket } from '@openchat/lib'
import { useStartDirectMessageMutation } from '@/features/chat/mutations'
import { useCreateChannelMutation } from '@/features/channels/mutations'
import { useChannels } from '@/features/channels/queries'
import { useCreateZoneInviteMutation, useRemoveZoneMemberMutation, useUpdateZoneMemberRoleMutation, useUpdateZoneMutation } from '@/features/zones/mutations'
import { useZoneMembers } from '@/features/zones/queries'
import { apiClient } from '@/lib/api/client'
import { useUser } from '@/features/user/queries'

type Friend = {
  id: number
  username: string
  avatar?: string | null
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
  const { data: currentUser } = useUser()
  const { data: members = [] } = useZoneMembers(zonePublicId, open)
  const { data: channels = [] } = useChannels(zonePublicId, open)
  const updateZoneMutation = useUpdateZoneMutation(zonePublicId)
  const removeMemberMutation = useRemoveZoneMemberMutation(zonePublicId)
  const updateRoleMutation = useUpdateZoneMemberRoleMutation(zonePublicId)
  const createChannelMutation = useCreateChannelMutation(zonePublicId)
  const createInviteMutation = useCreateZoneInviteMutation(zonePublicId)
  const startDirectMessageMutation = useStartDirectMessageMutation()

  const [friends, setFriends] = useState<Friend[]>([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [draftZoneName, setDraftZoneName] = useState(zoneName)
  const [draftZoneAvatar, setDraftZoneAvatar] = useState<string | null>(zoneAvatar ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [sendingInviteFor, setSendingInviteFor] = useState<number | 'general' | null>(null)
  const [sentInviteFor, setSentInviteFor] = useState<number | 'general' | null>(null)

  useEffect(() => {
    setDraftZoneName(zoneName)
  }, [zoneName])

  useEffect(() => {
    setDraftZoneAvatar(zoneAvatar ?? null)
  }, [zoneAvatar])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadFriends = async () => {
      try {
        const data = await apiClient.get<{ friends: Friend[] }>('/friends/list')

        if (!cancelled) {
          setFriends(data.friends ?? [])
        }
      } catch {
        if (!cancelled) {
          setFriends([])
        }
      }
    }

    void loadFriends()

    return () => {
      cancelled = true
    }
  }, [open])

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

    const zone = await updateZoneMutation.mutateAsync({
      name: nextName,
      avatar: avatarFile,
    })

    setDraftZoneName(zone.name)
    setDraftZoneAvatar(zone.avatar ?? null)
    setAvatarFile(null)
    onZoneUpdated?.({ name: zone.name, avatar: zone.avatar ?? null })
  }

  const createInviteLink = async () => {
    const invite = await createInviteMutation.mutateAsync()
    return `${window.location.origin}/zone/invite/${invite.code}`
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
      const chatPublicId = await startDirectMessageMutation.mutateAsync(friend.id)

      socket.emit('join-room', { chatPublicId })
      socket.emit('private-message', {
        chatPublicId,
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
                  <Button onClick={() => { void updateZoneInfo() }} disabled={updateZoneMutation.isPending}>
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
                  <Button
                    onClick={() => {
                      void createChannelMutation.mutateAsync({
                        name: newChannelName,
                        type: newChannelType,
                      }).then(() => setNewChannelName(''))
                    }}
                    disabled={!newChannelName.trim() || createChannelMutation.isPending}
                  >
                    Create
                  </Button>
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
                        onChange={(event) => {
                          void updateRoleMutation.mutateAsync({
                            userId: member.id,
                            role: event.target.value as 'ADMIN' | 'MEMBER',
                          })
                        }}
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
                        onClick={() => {
                          void removeMemberMutation.mutateAsync(member.id)
                        }}
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
                    onClick={() => {
                      void copyInviteLink('general')
                    }}
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
                        onClick={() => {
                          void sendInviteToFriend(friend)
                        }}
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
