'use client'

import { useEffect } from 'react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card
} from 'packages/ui'
import { Check, X, UserPlus } from 'lucide-react'
import { api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'
import { formatDistanceToNow } from 'date-fns'

export default function FriendRequests() {
  const requests = useFriendsStore(s => s.requests)
  const setRequests = useFriendsStore(s => s.setRequests)
  const removeRequest = useFriendsStore(s => s.removeRequest)
  const requestsLoaded = useFriendsStore(s => s.requestsLoaded)

  useEffect(() => {
    if (requestsLoaded) return

    api('/friends/requests')
      .then(res => res.json())
      .then(data => {
        const normalized = (data.requests || []).map((r: any) => ({
          id: r.id,
          from: r.sender,
          createdAt: r.createdAt,
        }))

        setRequests(normalized)
      })
      .catch(() => { })

  }, [requestsLoaded, setRequests])

  const accept = async (req: any) => {
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
    return (<div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl bg-muted/20"> <p className="text-sm font-medium text-muted-foreground italic">
      No friend requests </p> </div>
    )
  }

  return (<div className="grid gap-3">
    {requests.map((req: any) => (<Card
      key={req.id}
      className="group flex items-center justify-between p-4 shadow-sm border-muted/60 hover:border-muted-foreground/20 transition-all duration-200"
    > <div className="flex items-center gap-4">
        <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
          {req.from.avatar && (
            <AvatarImage src={req.from.avatar} />
          )}
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-xs">
            {req.from.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col space-y-0.5">
          <span className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
            {req.from.username}
          </span>

          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Sent {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
          </span>
        </div>

      </div>

      <div className="flex gap-2">

        <Button
          size="sm"
          className="h-8 px-3 text-xs font-bold active:scale-95"
          onClick={() => accept(req)}
        >
          <Check className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-3 text-xs font-bold active:scale-95"
          onClick={() => reject(req.id)}
        >
          <X className="h-4 w-4" />
        </Button>

      </div>
    </Card>
    ))
    }
  </div>

  )
}
