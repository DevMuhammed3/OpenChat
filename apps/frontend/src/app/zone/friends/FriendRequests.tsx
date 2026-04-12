'use client'

import { useEffect } from 'react'
import {
  Button,
  Card
} from 'packages/ui'
import { Check, X } from 'lucide-react'
import { api } from '@openchat/lib'
import { useFriendsStore, type FriendRequest, type User } from '@/app/stores/friends-store'
import { formatDistanceToNow } from 'date-fns'
import { UserAvatar } from '@/components/UserAvatar'

type ApiIncomingFriendRequest = {
  id: number
  sender: User
  createdAt: string
}

export default function FriendRequests() {
  const requests = useFriendsStore(s => s.requests)
  const setRequests = useFriendsStore(s => s.setRequests)
  const removeRequest = useFriendsStore(s => s.removeRequest)
  const requestsLoaded = useFriendsStore(s => s.requestsLoaded)

  useEffect(() => {
    if (requestsLoaded) return

    api('/friends/requests')
      .then(res => res.json())
      .then((data: { requests?: ApiIncomingFriendRequest[] }) => {
        const normalized: FriendRequest[] = (data.requests ?? []).map((r) => ({
          id: r.id,
          from: r.sender,
          createdAt: r.createdAt,
        }))

        setRequests(normalized)
      })
      .catch(() => { })

  }, [requestsLoaded, setRequests])

  const accept = async (req: FriendRequest) => {
    const res = await api(`/friends/accept/${req.id}`, { method: 'POST' })
    if (!res.ok) {
      throw new Error("Failed to accept friend request")
    }
    removeRequest(req.id)
  }

  const reject = async (id: number) => {
    const res = await api(`/friends/reject/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error("Failed to reject friend request")
    }
    removeRequest(id)
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl bg-muted/20">
        <p className="text-sm font-medium text-muted-foreground italic">
          No friend requests
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {requests.map((req) => (
        <Card
          key={req.id}
          className="flex items-center justify-between p-4 shadow-sm border-muted/60 hover:border-muted-foreground/20 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <UserAvatar
              name={req.from.name || req.from.username}
              avatar={req.from.avatar}
              className="h-12 w-12 border-2 border-background shadow-sm"
            />

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {req.from.name || req.from.username}
              </span>
              <span className="text-xs text-muted-foreground">
                @{req.from.username} · Sent {req.createdAt ? formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }) : 'recently'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 active:scale-95"
              onClick={() => accept(req)}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 active:scale-95"
              onClick={() => reject(req.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
