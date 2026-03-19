import { Server, Socket } from "socket.io"
import { prisma } from "../config/prisma.js"
import { resolveAssetUrl } from "../utils/resolveAssetUrl.js"

type CallStatus = "ringing" | "active"

interface CallParticipant {
  userId: number
  socketId: string | null
  isCaller: boolean
  lastSeen: number
}

interface ActiveCall {
  chatPublicId: string
  status: CallStatus
  participants: Map<number, CallParticipant>
  startTime?: number
  cleanupTimers: Map<number, NodeJS.Timeout>
}

const activeCalls = new Map<string, ActiveCall>()
const userToCall = new Map<number, string>()

interface AuthenticatedSocket extends Socket {
  data: {
    userId: number
  }
}

const DISCONNECT_TIMEOUT = 10000 // 10 seconds

export function callHandler(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.data.userId
  if (!userId) return

  /* =========================
     PERSISTENCE / RECONNECT
  ========================== */
  socket.on("call:check", async () => {
    const callId = userToCall.get(userId)
    if (!callId) {
      socket.emit("call:status", { status: "idle" })
      return
    }

    const call = activeCalls.get(callId)
    if (!call) {
      userToCall.delete(userId)
      socket.emit("call:status", { status: "idle" })
      return
    }

    // Update participant
    const participant = call.participants.get(userId)
    if (participant) {
      participant.socketId = socket.id
      participant.lastSeen = Date.now()
    }

    // Clear specific cleanup timer for this user
    const userTimer = call.cleanupTimers.get(userId)
    if (userTimer) {
      clearTimeout(userTimer)
      call.cleanupTimers.delete(userId)
    }

    // Join room
    socket.join(`chat:${call.chatPublicId}`)

    // Notify others
    socket.to(`chat:${call.chatPublicId}`).emit("call:rejoined", { userId })

    const partnerId = Array.from(call.participants.keys()).find(id => id !== userId)
    let partnerInfo = null
    if (partnerId) {
        const p = await prisma.user.findUnique({
            where: { id: partnerId },
            select: { id: true, username: true, avatar: true }
        })
        partnerInfo = p ? {
            id: p.id,
            name: p.username,
            image: resolveAssetUrl(p.avatar)
        } : null
    }

    socket.emit("call:status", {
      status: call.status === "ringing" ? (participant?.isCaller ? "calling" : "incoming") : "connected",
      chatPublicId: call.chatPublicId,
      user: partnerInfo,
      isCaller: participant?.isCaller,
      startTime: call.startTime
    })
  })

  /* =========================
     START CALL
  ========================== */
  socket.on("call:user", async ({ toUserId, chatPublicId }: { toUserId: number; chatPublicId: string }) => {
    try {
      if (!toUserId || toUserId === userId) return
      if (userToCall.has(userId) || userToCall.has(toUserId)) return

      const caller = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatar: true }
      })
      if (!caller) return

      const participants = new Map<number, CallParticipant>()
      participants.set(userId, { userId, socketId: socket.id, isCaller: true, lastSeen: Date.now() })
      participants.set(toUserId, { userId: toUserId, socketId: null, isCaller: false, lastSeen: Date.now() })

      const newCall: ActiveCall = {
        chatPublicId,
        status: "ringing",
        participants,
        cleanupTimers: new Map()
      }

      activeCalls.set(chatPublicId, newCall)
      userToCall.set(userId, chatPublicId)
      userToCall.set(toUserId, chatPublicId)

      socket.join(`chat:${chatPublicId}`)

      io.to(`user:${toUserId}`).emit("incoming:call", {
        chatPublicId,
        user: {
          id: caller.id,
          name: caller.username,
          image: resolveAssetUrl(caller.avatar)
        }
      })
    } catch (err) {
      console.error("CALL USER ERROR:", err)
    }
  })

  /* =========================
     ACCEPT / REJECT / END
  ========================== */
  socket.on("call:accept", ({ chatPublicId }: { chatPublicId: string }) => {
    const call = activeCalls.get(chatPublicId)
    if (!call) return

    call.status = "active"
    call.startTime = Date.now()
    socket.to(`chat:${chatPublicId}`).emit("call:accepted", { chatPublicId })
  })

  socket.on("call:reject", ({ chatPublicId }: { chatPublicId: string }) => {
    endCall(chatPublicId, "rejected")
  })

  socket.on("call:end", ({ chatPublicId }: { chatPublicId: string }) => {
    endCall(chatPublicId, "ended")
  })

  /* =========================
     SIGNALING
  ========================== */
  socket.on("call:offer", ({ chatPublicId, offer }) => {
    socket.to(`chat:${chatPublicId}`).emit("call:offer", { chatPublicId, offer, from: userId })
  })

  socket.on("call:answer", ({ chatPublicId, answer }) => {
    socket.to(`chat:${chatPublicId}`).emit("call:answer", { chatPublicId, answer })
  })

  socket.on("call:ice", ({ chatPublicId, candidate }) => {
    socket.to(`chat:${chatPublicId}`).emit("call:ice", { chatPublicId, candidate })
  })

  /* =========================
     ROOM
  ========================== */
  socket.on("join-room", ({ chatPublicId }) => {
    socket.join(`chat:${chatPublicId}`)
    const call = activeCalls.get(chatPublicId)
    if (call) {
      const p = call.participants.get(userId)
      if (p) {
        p.socketId = socket.id
        const timer = call.cleanupTimers.get(userId)
        if (timer) {
          clearTimeout(timer)
          call.cleanupTimers.delete(userId)
        }
      }
    }
  })

  /* =========================
     DISCONNECT
  ========================== */
  socket.on("disconnect", () => {
    const callId = userToCall.get(userId)
    if (!callId) return

    const call = activeCalls.get(callId)
    if (!call) return

    const participant = call.participants.get(userId)
    if (participant) {
      participant.socketId = null
      participant.lastSeen = Date.now()
      
      // Notify other
      socket.to(`chat:${call.chatPublicId}`).emit("call:partner-disconnected", { userId })

      // Start timer for this user
      const timer = setTimeout(() => {
        endCall(callId, "timeout")
      }, DISCONNECT_TIMEOUT)
      call.cleanupTimers.set(userId, timer)
    }
  })

  function endCall(chatPublicId: string, reason: string) {
    const call = activeCalls.get(chatPublicId)
    if (!call) return

    io.to(`chat:${chatPublicId}`).emit("call:ended", { chatPublicId, reason })

    for (const pId of call.participants.keys()) {
      userToCall.delete(pId)
    }
    for (const timer of call.cleanupTimers.values()) {
      clearTimeout(timer)
    }
    activeCalls.delete(chatPublicId)
  }
}
