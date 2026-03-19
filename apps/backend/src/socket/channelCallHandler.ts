import { Server, Socket } from "socket.io"
import { prisma } from "../config/prisma.js"
import { resolveAssetUrl } from "../utils/resolveAssetUrl.js"

interface ChannelParticipant {
  userId: number
  socketId: string
  username: string
  avatar: string | null
}

interface ActiveChannelCall {
  channelPublicId: string
  chatPublicId: string
  participants: Map<number, ChannelParticipant>
}

const activeChannelCalls = new Map<string, ActiveChannelCall>()

interface AuthenticatedSocket extends Socket {
  data: {
    userId: number
  }
}

export function getChannelCallPresence(channelPublicIds: string[]) {
  return channelPublicIds.map((channelPublicId) => ({
    channelPublicId,
    participants: Array.from(activeChannelCalls.get(channelPublicId)?.participants.values() ?? []),
  }))
}

export function channelCallHandler(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.data.userId
  if (!userId) return

  socket.on("channel:join-call", async ({ channelPublicId }: { channelPublicId: string }) => {
    try {
      const channel = await prisma.channel.findUnique({
        where: { publicId: channelPublicId },
        select: {
          publicId: true,
          chat: {
            select: {
              publicId: true,
            },
          },
        },
      })
      if (!channel) return

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatar: true }
      })
      if (!user) return

      let call = activeChannelCalls.get(channelPublicId)
      if (!call) {
        call = {
          channelPublicId,
          chatPublicId: channel.chat.publicId,
          participants: new Map()
        }
        activeChannelCalls.set(channelPublicId, call)
      }

      const participant: ChannelParticipant = {
        userId: user.id,
        socketId: socket.id,
        username: user.username,
        avatar: resolveAssetUrl(user.avatar)
      }

      call.participants.set(userId, participant)
      socket.join(`channel-call:${channelPublicId}`)

      // Notify others in the channel
      socket.to(`channel-call:${channelPublicId}`).emit("channel:user-joined", {
        channelPublicId,
        participant
      })
      io.to(`chat:${call.chatPublicId}`).emit("zone:voice-presence", {
        chatPublicId: call.chatPublicId,
        channelPublicId,
        participants: Array.from(call.participants.values()),
      })

      // Send list of current participants to the joiner
      const currentParticipants = Array.from(call.participants.values())
      socket.emit("channel:current-participants", {
        channelPublicId,
        participants: currentParticipants
      })

      console.log(`User ${userId} joined channel call ${channelPublicId}`)
    } catch (err) {
      console.error("CHANNEL JOIN CALL ERROR:", err)
    }
  })

  socket.on("channel:leave-call", ({ channelPublicId }: { channelPublicId: string }) => {
    leaveChannelCall(channelPublicId)
  })

  socket.on("channel:signal", ({ toSocketId, signal }: { toSocketId: string, signal: any }) => {
    // Relay signal to specific peer
    io.to(toSocketId).emit("channel:signal", {
      fromSocketId: socket.id,
      fromUserId: userId,
      signal
    })
  })

  socket.on("disconnect", () => {
    // Clean up all channel calls this user was in
    for (const [channelPublicId, call] of activeChannelCalls.entries()) {
      if (call.participants.has(userId)) {
        leaveChannelCall(channelPublicId)
      }
    }
  })

  function leaveChannelCall(channelPublicId: string) {
    const call = activeChannelCalls.get(channelPublicId)
    if (!call) return

    if (call.participants.has(userId)) {
      call.participants.delete(userId)
      socket.leave(`channel-call:${channelPublicId}`)
      
      io.to(`channel-call:${channelPublicId}`).emit("channel:user-left", {
        channelPublicId,
        userId
      })
      io.to(`chat:${call.chatPublicId}`).emit("zone:voice-presence", {
        chatPublicId: call.chatPublicId,
        channelPublicId,
        participants: Array.from(call.participants.values()),
      })

      if (call.participants.size === 0) {
        activeChannelCalls.delete(channelPublicId)
      }
      
      console.log(`User ${userId} left channel call ${channelPublicId}`)
    }
  }
}
