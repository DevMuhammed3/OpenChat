import { Server, Socket } from "socket.io"
import { prisma } from "../config/prisma.js"

async function isUserInChat(userId: number, chatPublicId: string) {
  const chat = await prisma.chat.findUnique({
    where: { publicId: chatPublicId },
    select: {
      id: true,
      participants: {
        where: { userId },
        select: { userId: true },
      },
    },
  })

  return !!chat && chat.participants.length > 0
}

export function privateChatHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId
  if (!userId) return

  socket.on("join-room", async ({ chatPublicId }: { chatPublicId: string }) => {
    if (!chatPublicId) return

    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.join(`chat:${chatPublicId}`)
  })

  socket.on("leave-room", ({ chatPublicId }: { chatPublicId: string }) => {
    if (!chatPublicId) return
    socket.leave(`chat:${chatPublicId}`)
  })

  socket.on(
    "private-message",
    async ({ chatPublicId, text }: { chatPublicId: string; text: string }) => {
      if (!text?.trim()) return

      const allowed = await isUserInChat(userId, chatPublicId)
      if (!allowed) return

      const chat = await prisma.chat.findUnique({
        where: { publicId: chatPublicId },
        select: { id: true },
      })

      if (!chat) return

      const saved = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          text,
        },
      })

      const room = `chat:${chatPublicId}`

      socket.to(room).emit("private-message", {
        id: saved.id,
        text: saved.text,
        senderId: userId,
        chatPublicId,
        createdAt: saved.createdAt,
      })

      socket.to(room).emit("chat-notification", {
        chatPublicId,
        senderId: userId,
      })
    }
  )


  socket.on("call:offer", async ({ chatPublicId, offer }) => {
    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.to(`chat:${chatPublicId}`).emit("call:offer", {
      chatPublicId,
      from: userId,
      offer,
    })
  })

  socket.on("call:answer", async ({ chatPublicId, answer }) => {
    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.to(`chat:${chatPublicId}`).emit("call:answer", {
      chatPublicId,
      from: userId,
      answer,
    })
  })

  socket.on("call:ice", async ({ chatPublicId, candidate }) => {
    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.to(`chat:${chatPublicId}`).emit("call:ice", {
      chatPublicId,
      from: userId,
      candidate,
    })
  })

  // call:end
  socket.on("call:end", async ({ chatPublicId }) => {
    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.to(`chat:${chatPublicId}`).emit("call:end", {
      chatPublicId,
      from: userId,
    })
  })

}

