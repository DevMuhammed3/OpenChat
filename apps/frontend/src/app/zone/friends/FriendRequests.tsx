'use client'

import { useEffect } from 'react'
import {
  Avatar,
  AvatarFallback,
  Button,
  ScrollArea,
} from 'packages/ui'
import { Check, X, UserPlus } from 'lucide-react'
import { api } from '@openchat/lib'
import { useFriendsStore } from '@/app/stores/friends-store'

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
      .catch(() => {})
  }, [requestsLoaded, setRequests])

  const accept = async (req: any) => {
    removeRequest(req.id)
    await api(`/friends/accept/${req.id}`, { method: 'POST' })
  }

  const reject = async (id: number) => {
    removeRequest(id)
    await api(`/friends/reject/${id}`, { method: 'DELETE' })
  }

  if (requests.length === 0) return null

  return (
    <div className="border-b p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-sm">Friend Requests</h2>
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {req.from.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                @{req.from.username}
              </div>

              <Button size="icon" onClick={() => accept(req)}>
                <Check />
              </Button>

              <Button size="icon" onClick={() => reject(req.id)}>
                <X />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

