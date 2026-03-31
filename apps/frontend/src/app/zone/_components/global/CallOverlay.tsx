'use client'

import { memo, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from "packages/ui"
import { Lock, Phone, PhoneOff } from "lucide-react"
import { useCallStore } from "@/app/stores/call-store"

interface Props {
  onAccept: () => void
  onReject: () => void
  onEnd: () => void
}

const DIALOG_WIDTH = 360
const DIALOG_HEIGHT = 320
const VIEWPORT_MARGIN = 16

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getInitialPosition() {
  if (typeof window === "undefined") {
    return { x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN }
  }

  const width = Math.min(DIALOG_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)

  return {
    x: Math.max(VIEWPORT_MARGIN, (window.innerWidth - width) / 2),
    y: Math.max(VIEWPORT_MARGIN, (window.innerHeight - DIALOG_HEIGHT) / 2),
  }
}

function CallOverlayComponent({ onAccept, onReject, onEnd }: Props) {
  const status = useCallStore((state) => state.status)
  const user = useCallStore((state) => state.user)
  const [initialPosition] = useState(getInitialPosition)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef({
    dragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    nextX: 0,
    nextY: 0,
    frameId: 0,
  })
  const positionRef = useRef(initialPosition)

  const isRinging = status === "calling" || status === "incoming"

  useEffect(() => {
    if (!isRinging) return

    const panel = panelRef.current
    if (!panel) return

    const { x, y } = positionRef.current
    panel.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }, [isRinging])

  useEffect(() => {
    if (!isRinging) return

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      if (!dragState.dragging || dragState.pointerId !== event.pointerId) return

      dragState.nextX = event.clientX - dragState.offsetX
      dragState.nextY = event.clientY - dragState.offsetY

      if (dragState.frameId) return

      dragState.frameId = window.requestAnimationFrame(() => {
        dragState.frameId = 0

        const panel = panelRef.current
        if (!panel) return

        const maxX = Math.max(
          VIEWPORT_MARGIN,
          window.innerWidth - panel.offsetWidth - VIEWPORT_MARGIN,
        )
        const maxY = Math.max(
          VIEWPORT_MARGIN,
          window.innerHeight - panel.offsetHeight - VIEWPORT_MARGIN,
        )

        const x = clamp(dragState.nextX, VIEWPORT_MARGIN, maxX)
        const y = clamp(dragState.nextY, VIEWPORT_MARGIN, maxY)

        positionRef.current = { x, y }
        panel.style.transform = `translate3d(${x}px, ${y}px, 0)`
      })
    }

    const stopDragging = (pointerId?: number) => {
      const dragState = dragStateRef.current
      if (pointerId !== undefined && dragState.pointerId !== pointerId) return

      dragState.dragging = false
      dragState.pointerId = -1

      if (dragState.frameId) {
        window.cancelAnimationFrame(dragState.frameId)
        dragState.frameId = 0
      }
    }

    const handlePointerUp = (event: PointerEvent) => stopDragging(event.pointerId)
    const handlePointerCancel = (event: PointerEvent) => stopDragging(event.pointerId)

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
      stopDragging()
    }
  }, [isRinging])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("button, a, input, textarea, select, [data-no-drag='true']")) return

    const panel = panelRef.current
    if (!panel) return

    dragStateRef.current.dragging = true
    dragStateRef.current.pointerId = event.pointerId
    dragStateRef.current.offsetX = event.clientX - positionRef.current.x
    dragStateRef.current.offsetY = event.clientY - positionRef.current.y
    panel.setPointerCapture?.(event.pointerId)
  }

  const title = status === "calling" ? "Calling..." : status === "incoming" ? "Incoming call..." : ""

  if (status === "idle" || status === "connecting" || status === "connected" || !user) return null

  return (
    <>
      {isRinging && user && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div
            ref={panelRef}
            onPointerDown={handlePointerDown}
            className="pointer-events-auto absolute w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-md will-change-transform select-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate3d(${initialPosition.x}px, ${initialPosition.y}px, 0)`,
              touchAction: "none",
            }}
          >
            <div className="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              <span>Voice Call</span>
              <span>Drag Anywhere</span>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <Lock className="h-3.5 w-3.5" />
              Secure via WebRTC
            </div>

            <div className="mb-6 flex items-center gap-4">
              <Avatar className={`h-16 w-16 border-2 border-primary/20 ${status !== "connected" ? "animate-pulse" : ""}`}>
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {user.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{user.name}</h3>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              {status === "incoming" && (
                <>
                  <Button
                    size="lg"
                    className="h-12 flex-1 gap-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    onClick={onAccept}
                  >
                    <Phone className="h-5 w-5 fill-current" />
                    <span>Accept</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 flex-1 gap-2 rounded-xl"
                    onClick={onReject}
                  >
                    <PhoneOff className="h-5 w-5 fill-current" />
                    <span>Reject</span>
                  </Button>
                </>
              )}

              {status === "calling" && (
                <Button
                  variant="destructive"
                  className="h-12 w-full gap-2 rounded-xl"
                  onClick={onEnd}
                >
                  <PhoneOff className="h-5 w-5 fill-current" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(CallOverlayComponent)
