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
import { useCreateZoneInviteMutation, useRemoveZoneMemberMutation, useUpdateZoneMemberRoleMutation, useUpdateZoneMutation, useDeleteZoneMutation, useLeaveZoneMutation } from '@/features/zones/mutations'
import { useZoneMembers, useZone } from '@/features/zones/queries'
import { apiClient } from '@/lib/api/client'
import { useUser } from '@/features/user/queries'
import { toast } from 'sonner'
import { AlertTriangle, Camera, Plus } from 'lucide-react'
import { cn } from '@openchat/lib'

type Friend = {
  id: number
  username: string
  avatar?: string | null
}

type ZoneSettingsProps = {
  zonePublicId: string
  zoneName?: string
  zoneAvatar?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onZoneUpdated?: (zone: { name: string; avatar: string | null }) => void
}

export default function ZoneSettings({
  zonePublicId,
  zoneName,
  zoneAvatar,
  open,
  onOpenChange,
  onZoneUpdated,
}: ZoneSettingsProps) {
  const { data: zone } = useZone(zonePublicId)
  const { data: currentUser } = useUser()
  const { data: members = [] } = useZoneMembers(zonePublicId, open)
  const { data: channels = [] } = useChannels(zonePublicId, open)
  
  const updateZoneMutation = useUpdateZoneMutation(zonePublicId)
  const deleteZoneMutation = useDeleteZoneMutation(zonePublicId)
  const leaveZoneMutation = useLeaveZoneMutation(zonePublicId)
  const removeMemberMutation = useRemoveZoneMemberMutation(zonePublicId)
  const updateRoleMutation = useUpdateZoneMemberRoleMutation(zonePublicId)
  const createChannelMutation = useCreateChannelMutation(zonePublicId)
  const createInviteMutation = useCreateZoneInviteMutation(zonePublicId)
  const startDirectMessageMutation = useStartDirectMessageMutation()

  const [friends, setFriends] = useState<Friend[]>([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT')
  const [draftZoneName, setDraftZoneName] = useState(zoneName ?? zone?.name ?? '')
  const [draftZoneAvatar, setDraftZoneAvatar] = useState<string | null>(zoneAvatar ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [sendingInviteFor, setSendingInviteFor] = useState<number | 'general' | null>(null)
  const [sentInviteFor, setSentInviteFor] = useState<number | 'general' | null>(null)
  
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'channels' | 'invites' | 'danger'>('general')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const myMembership = useMemo(
    () => members.find((member) => member.id === currentUser?.id) ?? null,
    [currentUser?.id, members],
  )

  const isOwner = myMembership?.role === 'OWNER'

  useEffect(() => {
    if (zoneName !== undefined) {
      setDraftZoneName(zoneName)
    } else if (zone?.name) {
      setDraftZoneName(zone.name)
    }
  }, [zoneName, zone?.name])

  useEffect(() => {
    if (zoneAvatar !== undefined) {
      setDraftZoneAvatar(zoneAvatar ?? null)
    } else if (zone?.avatar !== undefined) {
      setDraftZoneAvatar(zone.avatar ?? null)
    }
  }, [zoneAvatar, zone?.avatar])

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

  useEffect(() => {
    if (!open) {
      setActiveTab('general')
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
      setShowLeaveConfirm(false)
    }
  }, [open])

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

  const handleAvatarChange = (file: File | null) => {
    if (!file) return
    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 2MB")
      return
    }
    setAvatarFile(file)
    setDraftZoneAvatar(URL.createObjectURL(file))
  }

  const updateZoneInfo = async () => {
    const nextName = draftZoneName.trim()
    if (!canManageZoneInfo || (!nextName && !avatarFile)) return
    
    if (nextName.length > 50) {
      toast.error("Zone name must be 50 characters or less")
      return
    }

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

  const handleDelete = async () => {
    if (deleteConfirmText !== draftZoneName) return
    try {
      await deleteZoneMutation.mutateAsync()
      window.location.href = '/zone/zones'
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleLeave = async () => {
    await leaveZoneMutation.mutateAsync()
    window.location.href = '/zone/zones'
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members' },
    { id: 'channels', label: 'Channels' },
    ...(canManageMembers ? [{ id: 'invites', label: 'Invites' }] : []),
    { id: 'danger', label: 'Danger' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-hidden border-white/10 bg-main text-foreground sm:max-w-xl flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{zoneName} Settings</SheetTitle>
              <SheetDescription>
                Manage zone settings, members, and channels.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex border-b border-white/10 mt-4 -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-foreground border-b-2 border-[hsl(var(--primary))]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto mt-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {canManageZoneInfo && (
                <section className="space-y-3">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="group relative cursor-pointer"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0] ?? null
                          handleAvatarChange(file)
                        }
                        input.click()
                      }}
                    >
                      <div className="h-24 w-24 rounded-full border-2 border-white/10 bg-surface overflow-hidden transition-all group-hover:border-[hsl(var(--primary))]/50 group-hover:scale-105">
                        {draftZoneAvatar ? (
                          <Avatar className="h-full w-full">
                            <AvatarImage src={getAvatarUrl(draftZoneAvatar)} className="object-cover" />
                            <AvatarFallback className="bg-transparent">
                              <Plus className="w-8 h-8 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                      Change Avatar
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 -mt-3">JPG, PNG up to 2MB</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Zone Name</label>
                    <Input
                      value={draftZoneName}
                      onChange={(event) => setDraftZoneName(event.target.value)}
                      placeholder="Zone name"
                      className="border-white/10 bg-white/5 text-foreground"
                    />
                  </div>

                  <Button
                    onClick={() => { void updateZoneInfo() }}
                    disabled={updateZoneMutation.isPending}
                    className="w-full"
                  >
                    {updateZoneMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </section>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <section className="space-y-3">
              <p className="text-sm text-muted-foreground">{members.length} members</p>
              <div className="space-y-2">
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
                    <div key={member.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                      <Avatar className="h-10 w-10 ring-1 ring-white/10">
                        <AvatarImage src={getAvatarUrl(member.avatar)} />
                        <AvatarFallback className="bg-white/10 text-foreground">
                          {member.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{member.username}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{member.role}</p>
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
                          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                        </select>
                      ) : (
                        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
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
          )}

          {activeTab === 'channels' && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Channels</h3>
                <p className="text-sm text-muted-foreground">All rooms in this zone update live.</p>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-surface p-3">
                {channels.map((channel) => (
                  <div key={channel.publicId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="font-medium text-foreground">#{channel.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{channel.type}</span>
                  </div>
                ))}
              </div>

              {canCreateChannels && (
                <div className="rounded-2xl border border-white/10 bg-surface p-3">
                  <p className="mb-3 text-sm font-medium text-foreground">Create channel</p>
                  <div className="flex gap-2">
                    <Input
                      value={newChannelName}
                      onChange={(event) => setNewChannelName(event.target.value)}
                      placeholder="new-room"
                      className="border-white/10 bg-white/5 text-foreground"
                    />
                    <select
                      value={newChannelType}
                      onChange={(event) => setNewChannelType(event.target.value as 'TEXT' | 'VOICE')}
                      className="rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground"
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
          )}

          {activeTab === 'invites' && canManageMembers && (
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invite By Link</h3>
                <p className="text-sm text-muted-foreground">Nobody gets added directly. They have to open the invite link and join themselves.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-surface p-3">
                <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">General invite link</p>
                    <p className="text-xs text-muted-foreground">Copy it and send it anywhere in DM.</p>
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
                  className="mb-3 border-white/10 bg-white/5 text-foreground"
                />

                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                      <Avatar className="h-9 w-9 ring-1 ring-white/10">
                        <AvatarImage src={getAvatarUrl(friend.avatar)} />
                        <AvatarFallback className="bg-white/10 text-foreground">
                          {friend.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm font-medium text-foreground">{friend.username}</span>
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
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No available friends to add.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'danger' && (
            <section className="space-y-6">
              {isOwner ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-foreground">Delete Zone</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This action is irreversible. All channels and messages will be permanently deleted.
                  </p>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full"
                    >
                      Delete Zone
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Please type the zone name to confirm deletion
                      </p>
                      <Input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500/50"
                        placeholder={`Type "${draftZoneName}"`}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                          }}
                          className="flex-1 text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDelete}
                          disabled={deleteConfirmText !== draftZoneName || deleteZoneMutation.isPending}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteZoneMutation.isPending ? "Deleting..." : "Confirm Delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-foreground">Leave Zone</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You will be removed from this zone and lose access to all channels.
                  </p>

                  {!showLeaveConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full"
                    >
                      Leave Zone
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleLeave}
                        disabled={leaveZoneMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {leaveZoneMutation.isPending ? "Leaving..." : "Confirm Leave"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}