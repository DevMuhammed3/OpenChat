'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, ScrollArea } from 'packages/ui'
import { User, Users } from 'lucide-react'
import { cn } from '@openchat/lib'
import { api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'

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
    const setFriends = useFriendsStore((s) => s.setFriends)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (friends.length > 0) {
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
    }, [friends.length, setFriends])

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
                    <div
                        className="
              py-8
              text-center text-sm text-muted-foreground
            "
                    >
                        Loading friends...
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
                    <ScrollArea
                        className="
              h-[400px]
            "
                    >
                        <div
                            className="
                space-y-1
              "
                        >
                            {friends.map((friend) => {
                                const isActive = username === friend.username

                                return (
                                    <button
                                        key={friend.id}
                                        onClick={() => onSelectFriend?.(friend)}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-muted'
                                                : 'hover:bg-muted/50'
                                        )}
                                    >
                                        <Avatar
                                            className="
                        h-10 w-10
                      "
                                        >
                                            <AvatarFallback
                                                className="
                          text-primary-foreground
                        "
                                            >
                                                <User
                                                    className="
                            h-5 w-5
                          "
                                                />
                                            </AvatarFallback>
                                        </Avatar>

                                        <div
                                            className="
                        flex-1
                        min-w-0
                        text-left
                      "
                                        >
                                            <p
                                                className="
                          font-medium text-md truncate
                        "
                                            >
                                                {friend.username}
                                            </p>
                                            <p
                                                className="
                          text-xs text-muted-foreground truncate
                        "
                                            >
                                                @{friend.username}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <div
                                                className="
                          h-2 w-2
                          bg-primary
                          rounded-full
                        "
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}
