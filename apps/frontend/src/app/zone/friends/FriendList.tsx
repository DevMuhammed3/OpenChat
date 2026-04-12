'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
  Skeleton,
} from 'packages/ui'
import { Info, ShieldBan, UserMinus, Users } from 'lucide-react'
import { cn } from '@openchat/lib'
import { api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'
import { UserAvatar } from '@/components/UserAvatar'

type Friend = {
  id: number
  username: string
  name?: string | null
  avatar?: string | null
}

interface FriendListProps {
  onSelectFriend?: (friend: Friend) => void
}

export default function FriendList({ onSelectFriend }: FriendListProps) {
  const { username } = useParams<{ username?: string }>()

  const friends = useFriendsStore((s) => s.friends)
  const friendsLoaded = useFriendsStore((s) => s.friendsLoaded)
  const setFriends = useFriendsStore((s) => s.setFriends)
  const removeFriendFromStore = useFriendsStore((s) => s.removeFriend)
  const addBlockedUser = useFriendsStore((s) => s.addBlockedUser)
  const onlineUsers = useFriendsStore((s) => s.onlineUsers)

  const [loading, setLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<number | null>(null)

  useEffect(() => {
    if (friendsLoaded) {
      setLoading(false)
      return
    }

    let mounted = true

    api('/friends/list')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setFriends(data.friends || [])
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))

    return () => {
      mounted = false
    }
  }, [friendsLoaded, setFriends])

  const removeFriend = async (friend: Friend) => {
    try {
      setBusyUserId(friend.id)
      const res = await api(`/friends/${friend.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove friend')
      removeFriendFromStore(friend.id)
    } finally {
      setBusyUserId(null)
    }
  }

  const blockFriend = async (friend: Friend) => {
    try {
      setBusyUserId(friend.id)
      const res = await api(`/friends/block/${friend.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to block user')
      addBlockedUser(data.user ?? friend)
      removeFriendFromStore(friend.id)
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div
      className="
        flex-1
      "
    >
      <div
        className="
          p-4
        "
      >
        {/* Header */}
        <div
          className="
            flex items-center
            mb-3
            gap-2
          "
        >
          <Users
            className="
              h-5 w-5
              text-muted-foreground
            "
          />
          <h2
            className="
              font-semibold text-sm
            "
          >
            Friends
          </h2>
          {friends.length > 0 && (
            <span
              className="
                ml-auto
                text-xs text-muted-foreground
              "
            >
              {friends.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && friends.length === 0 && (
          <div
            className="
              py-8
              text-center
            "
          >
            <p
              className="
                text-sm text-muted-foreground
              "
            >
              No friends yet
            </p>
          </div>
        )}

        {/* List */}
        {!loading && friends.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {friends.map((friend) => {
                const isActive = username === friend.username

                return (
                  <div
                    key={friend.id}
                    className={cn(
                      'w-full rounded-lg transition-colors',
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <button
                        onClick={() => onSelectFriend?.(friend)}
                        className="flex flex-1 items-center gap-3 rounded-md p-1 text-left"
                      >
                        <div className="relative">
                          <UserAvatar
                            name={friend.name || friend.username}
                            avatar={friend.avatar}
                            className="h-10 w-10 ring-1 ring-border"
                            fallbackText={friend.username}
                          />
                          {onlineUsers.has(friend.id) && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-medium text-md truncate">
                            {friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{friend.username}
                          </p>
                        </div>

                        {isActive && (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hidden md:block h-8 w-8 text-muted-foreground"
                            disabled={busyUserId === friend.id}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => removeFriend(friend)}
                            className="cursor-pointer"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove Friend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => blockFriend(friend)}
                            className="cursor-pointer text-red-500 focus:text-red-500"
                          >
                            <ShieldBan className="mr-2 h-4 w-4" />
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
              </div>
    </div>
  )
}
