'use client'

import { useEffect, useState } from 'react'
import { Button, Card } from 'packages/ui'
import { ShieldCheck } from 'lucide-react'
import { api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'
import { UserAvatar } from '@/components/UserAvatar'

type BlockedUser = {
  id: number
  username: string
  name?: string | null
  avatar?: string | null
  blockedAt?: string
}

export default function BlockedUsers() {
  const blockedUsers = useFriendsStore((state) => state.blockedUsers)
  const blockedUsersLoaded = useFriendsStore((state) => state.blockedUsersLoaded)
  const setBlockedUsers = useFriendsStore((state) => state.setBlockedUsers)
  const removeBlockedUser = useFriendsStore((state) => state.removeBlockedUser)
  const [busyUserId, setBusyUserId] = useState<number | null>(null)

  useEffect(() => {
    if (blockedUsersLoaded) return

    api('/friends/blocked')
      .then((res) => res.json())
      .then((data) => {
        setBlockedUsers(data.blocked ?? [])
      })
      .catch(() => {})
  }, [blockedUsersLoaded, setBlockedUsers])

  const unblock = async (userId: number) => {
    try {
      setBusyUserId(userId)
      const res = await api(`/friends/block/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to unblock user')
      removeBlockedUser(userId)
    } finally {
      setBusyUserId(null)
    }
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl bg-muted/20">
        <p className="text-sm font-medium text-muted-foreground italic">
          No blocked users
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {blockedUsers.map((user: BlockedUser) => (
        <Card
          key={user.id}
          className="flex items-center justify-between p-4 shadow-sm border-muted/60"
        >
          <div className="flex items-center gap-4">
            <UserAvatar
              name={user.name || user.username}
              avatar={user.avatar}
              className="h-11 w-11 border-2 border-background shadow-sm"
              fallbackText={user.username}
            />

            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">
                {user.username}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Blocked
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 text-xs font-bold"
            onClick={() => unblock(user.id)}
            disabled={busyUserId === user.id}
          >
            <ShieldCheck className="h-4 w-4" />
            Unblock
          </Button>
        </Card>
      ))}
    </div>
  )
}
