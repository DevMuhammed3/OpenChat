import { Server, Socket } from "socket.io"
import { prisma } from "../config/prisma.js"

const activeCalls = new Map<number, number>()

interface AuthenticatedSocket extends Socket {
  data: {
    userId: number
  }
}

interface CallPayload {
  toUserId: number
  chatPublicId: string
}

export function callHandler(
  io: Server,
  socket: AuthenticatedSocket
) {
  const userId = socket.data.userId
  if (!userId) return

  /* =========================
     CALL USER
  ========================== */
  socket.on("call:user", async ({ toUserId, chatPublicId }: CallPayload) => {
    try {
      if (!toUserId) return
      if (toUserId === userId) return

      const existingPartner = activeCalls.get(userId)
      if (existingPartner) {
        io.to(`user:${existingPartner}`).emit("call:ended")
        activeCalls.delete(existingPartner)
        activeCalls.delete(userId)
      }

      // هات بيانات المتصل من DB
      const caller = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      })

      if (!caller) return

      activeCalls.set(userId, toUserId)
      activeCalls.set(toUserId, userId)

      if (toUserId) {
        io.to(`user:${toUserId}`).emit("incoming:call", {
          chatPublicId,
          user: {
            id: caller.id,
            name: caller.username,
            image: caller.avatar
              ? `${process.env.BASE_URL}/uploads/${caller.avatar}`
              : null,
          },
        })
      }
    } catch (err) {
      console.error("CALL USER ERROR:", err)
    }
  })

  /* =========================
     ACCEPT
  ========================== */
  socket.on("call:accept", ({ toUserId, chatPublicId }: CallPayload) => {
    if (toUserId) {
      io.to(`user:${toUserId}`).emit("call:accepted", {
        chatPublicId,
      })
    }
  })

  /* =========================
     REJECT
  ========================== */
  socket.on("call:reject", ({ toUserId, chatPublicId }: CallPayload) => {
    activeCalls.delete(userId)
    if (toUserId) {
      activeCalls.delete(toUserId)
      io.to(`user:${toUserId}`).emit("call:rejected", {
        chatPublicId,
      })
    }
  })

  /* =========================
     END CALL
  ========================== */
  socket.on("call:end", ({ toUserId, chatPublicId }: CallPayload) => {
    activeCalls.delete(userId)
    if (toUserId) {
      activeCalls.delete(toUserId)
      io.to(`user:${toUserId}`).emit("call:ended", {
        chatPublicId,
      })
    }
  })

  /* =========================
     DISCONNECT
  ========================== */
  socket.on("disconnect", () => {
    const partner = activeCalls.get(userId)

      if (partner) {
        io.to(`user:${partner}`).emit("call:ended")
        activeCalls.delete(userId)
        activeCalls.delete(partner)
      }
  })
}
