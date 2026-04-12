'use client'

import { useEffect } from 'react'
import { UserAvatar } from '@/components/UserAvatar'
import { cn } from '@openchat/lib'

export type ProfileModalProfile = {
  id: string | number
  name: string
  avatar?: string | null
  bio?: string | null
  mutualFriends?: { id: string; name: string }[]
  mutualZones?: { id: string; name: string }[]
  joinedAt?: string | null
  isOnline?: boolean
  lastSeen?: string | null
  friendStatus?: 'none' | 'pending' | 'accepted'
}

export type ProfileModalProps = {
  profile: ProfileModalProfile | null
  open: boolean
  onClose: () => void
  canManageFriend?: boolean
  onAddFriend?: () => void
  onRemoveFriend?: () => void
  onBlock?: () => void
  onViewProfile?: () => void
}

export function ProfileModal({
  profile,
  open,
  onClose,
  canManageFriend,
  onAddFriend,
  onRemoveFriend,
  onBlock,
  onViewProfile,
}: ProfileModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !profile) return null

  const name = profile.name?.trim() || 'User'
  const hasBio = Boolean(profile.bio && profile.bio.trim().length > 0)
  const hasMutualFriends = Boolean(profile.mutualFriends && profile.mutualFriends.length > 0)
  const hasMutualZones = Boolean(profile.mutualZones && profile.mutualZones.length > 0)
  const hasSharedInfo = hasBio || hasMutualFriends || hasMutualZones

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-background rounded-xl shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <UserAvatar
              name={name}
              avatar={profile.avatar}
              className="w-20 h-20"
              fallbackClassName="bg-primary/20 text-primary text-2xl font-bold"
            />

            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{name}</h2>
              {hasBio ? (
                <p className="text-sm text-muted-foreground max-w-[220px]">{profile.bio}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {hasMutualFriends && (
              <div className="rounded-xl border p-3 bg-muted/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mutual Friends
                </span>
                <p className="text-sm font-medium mt-1">
                  {profile.mutualFriends?.length} mutual friend{profile.mutualFriends!.length !== 1 ? 's' : ''}
                </p>
                {profile.mutualFriends && profile.mutualFriends.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {profile.mutualFriends.slice(0, 3).map((friend) => friend.name).join(', ')}
                    {profile.mutualFriends.length > 3 ? '…' : ''}
                  </p>
                ) : null}
              </div>
            )}

            {hasMutualZones ? (
              <div className="rounded-xl border p-3 bg-muted/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Shared Zones
                </span>
                <p className="text-sm font-medium mt-1">
                  {profile.mutualZones?.length} shared zone{profile.mutualZones!.length !== 1 ? 's' : ''}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {profile.mutualZones?.map((zone) => (
                    <li key={zone.id} className="truncate">{zone.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!hasSharedInfo ? (
              <div className="rounded-xl border p-3 bg-muted/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Info
                </span>
                <p className="text-sm text-muted-foreground mt-1">No shared information</p>
              </div>
            ) : null}
          </div>

          {(profile.joinedAt || profile.isOnline !== undefined || profile.lastSeen) ? (
            <div className="text-xs text-muted-foreground space-y-1">
              {profile.joinedAt ? (
                <div>Joined {new Date(profile.joinedAt).toLocaleDateString()}</div>
              ) : null}
              {profile.isOnline === true ? (
                <div className="text-green-500">Online now</div>
              ) : profile.lastSeen ? (
                <div>Last seen {new Date(profile.lastSeen).toLocaleString()}</div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              onClick={onViewProfile}
              disabled={!onViewProfile}
              className="w-full py-2 rounded-lg border hover:bg-muted transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              View Profile
            </button>

            {canManageFriend && profile.friendStatus === 'none' ? (
              <button
                onClick={onAddFriend}
                disabled={!onAddFriend}
                className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Add Friend
              </button>
            ) : null}

            {canManageFriend && profile.friendStatus === 'pending' ? (
              <button
                disabled
                className="w-full py-2 rounded-lg bg-muted text-muted-foreground transition-all duration-200 disabled:opacity-50"
              >
                Pending
              </button>
            ) : null}

            {canManageFriend && profile.friendStatus === 'accepted' ? (
              <button
                onClick={onRemoveFriend}
                disabled={!onRemoveFriend}
                className="w-full py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Remove Friend
              </button>
            ) : null}

            {canManageFriend ? (
              <button
                onClick={onBlock}
                disabled={!onBlock}
                className="w-full py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Block
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg border hover:bg-muted transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}