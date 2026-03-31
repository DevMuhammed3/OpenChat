"use client"
import { api } from "@openchat/lib"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Card, Skeleton } from "packages/ui"
import { formatDistanceToNow } from "date-fns"
import { useFriendsStore } from "@/app/stores/friends-store"

export default function PendingRequests() {
  const pending = useFriendsStore((s) => s.pendingRequests)
  const pendingLoaded = useFriendsStore((s) => s.pendingRequestsLoaded)
  const setPendingRequests = useFriendsStore((s) => s.setPendingRequests)
  const removePendingRequest = useFriendsStore((s) => s.removePendingRequest)
  const [processingIds, setProcessingIds] = useState<number[]>([])

  useEffect(() => {
    if (pendingLoaded) return

    api("/friends/pending")
      .then((res) => res.json())
      .then((data) => {
        setPendingRequests(data.requests ?? [])
      })
      .catch((error) => {
        console.error("Failed to fetch pending requests:", error)
      })
  }, [pendingLoaded, setPendingRequests])

  const cancelRequest = async (id: number) => {
    setProcessingIds(prev => [...prev, id])
    try {
      await api(`/friends/reject/${id}`, { method: "DELETE" })
      removePendingRequest(id)
    } catch (error) {
      console.error("Failed to cancel:", error)
    } finally {
      setProcessingIds(prev => prev.filter(pid => pid !== id))
    }
  }

  if (!pendingLoaded) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-muted" />
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
        <p className="text-sm font-medium text-muted-foreground italic">No pending requests found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {pending.map(r => (
        <Card key={r.id} className="group flex items-center justify-between p-4 shadow-sm border-muted/60 hover:border-muted-foreground/20 transition-all duration-200">
          <div className="flex items-center gap-4">
            <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
              {r.to.avatar && <AvatarImage src={r.to.avatar} alt={r.to.name} />}
              <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-xs">
                {r.to.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-0.5">
              <span className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">
                {r.to.name}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Sent {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs font-bold text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all active:scale-95"
            onClick={() => cancelRequest(r.id)}
            disabled={processingIds.includes(r.id)}
          >
            {processingIds.includes(r.id) ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-destructive/20 border-t-destructive rounded-full animate-spin" />
                <span>Wait</span>
              </div>
            ) : (
              "Cancel"
            )}
          </Button>
        </Card>
      ))}
    </div>
  )
}
