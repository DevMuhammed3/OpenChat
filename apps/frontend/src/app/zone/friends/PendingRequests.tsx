"use client"

import { api } from "@openchat/lib"
import { useEffect } from "react"
import { Button, Card, Skeleton } from "packages/ui"
import { formatDistanceToNow } from "date-fns"
import { useFriendsStore } from "@/app/stores/friends-store"
import { X } from "lucide-react"
import { UserAvatar } from "@/components/UserAvatar"

export default function PendingRequests() {
  const pending = useFriendsStore((s) => s.pendingRequests)
  const pendingLoaded = useFriendsStore((s) => s.pendingRequestsLoaded)
  const setPendingRequests = useFriendsStore((s) => s.setPendingRequests)
  const removePendingRequest = useFriendsStore((s) => s.removePendingRequest)

  useEffect(() => {
    if (pendingLoaded) return

    api("/friends/pending")
      .then((res) => res.json())
      .then((data) => {
        setPendingRequests(data.requests ?? [])
      })
      .catch(() => {})
  }, [pendingLoaded, setPendingRequests])

  const cancelRequest = async (id: number) => {
    try {
      await api(`/friends/reject/${id}`, { method: "DELETE" })
      removePendingRequest(id)
    } catch (error) {
      console.error("Failed to cancel:", error)
    }
  }

  if (!pendingLoaded) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full bg-muted" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-muted" />
                <Skeleton className="h-3 w-20 bg-muted/60" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl bg-muted/20">
        <p className="text-sm font-medium text-muted-foreground italic">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {pending.map(r => (
        <Card key={r.id} className="flex items-center justify-between p-4 shadow-sm border-muted/60 hover:border-muted-foreground/20 transition-all duration-200">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={r.to.name || r.to.username}
              avatar={r.to.avatar}
              className="h-12 w-12 border-2 border-background shadow-sm"
            />

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {r.to.name || r.to.username}
              </span>
              <span className="text-xs text-muted-foreground">
                @{r.to.username} · Sent {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : "recently"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 active:scale-95"
            onClick={() => cancelRequest(r.id)}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </Card>
      ))}
    </div>
  )
}
