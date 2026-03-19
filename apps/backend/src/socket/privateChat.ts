import { Server, Socket } from "socket.io"
import { prisma } from "../config/prisma.js"
import { encryptMessage } from "../utils/crypto.js"

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

  socket.on("join-room", async ({ chatPublicId, channelPublicId }: { chatPublicId: string; channelPublicId?: string }) => {
    if (!chatPublicId) return

    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.join(`chat:${chatPublicId}`)
    if (channelPublicId) {
      socket.join(`channel:${channelPublicId}`)
    }
  })

  socket.on("leave-room", ({ chatPublicId, channelPublicId }: { chatPublicId: string; channelPublicId?: string }) => {
    if (!chatPublicId) return
    socket.leave(`chat:${chatPublicId}`)
    if (channelPublicId) {
      socket.leave(`channel:${channelPublicId}`)
    }
  })

  socket.on(
    "private-message",
    async (
      {
        chatPublicId,
        channelPublicId,
        text,
        fileUrl,
        fileType,
      }: {
        chatPublicId: string
        channelPublicId?: string | null
        text?: string | null
        fileUrl?: string | null
        fileType?: string | null
      },
      callback?: (message: any) => void
    ) => {
      if (!text?.trim() && !fileUrl) return

      const allowed = await isUserInChat(userId, chatPublicId)
      if (!allowed) return

      const chat = await prisma.chat.findUnique({
        where: { publicId: chatPublicId },
        select: { id: true },
      })

      if (!chat) return

      let channelId: number | undefined
      if (channelPublicId) {
        const channel = await prisma.channel.findUnique({
          where: { publicId: channelPublicId },
          select: { id: true }
        })
        channelId = channel?.id
      }

      const saved = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          text: text?.trim() ? encryptMessage(text.trim()) : null,
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          channelId: channelId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      })

      const recipients = channelPublicId
        ? []
        : await prisma.chatParticipant.findMany({
            where: {
              chatId: chat.id,
              userId: {
                not: userId,
              },
            },
            select: {
              userId: true,
            },
          })

      const messagePayload = {
        id: saved.id,
        text: text?.trim() || null,
        fileUrl: saved.fileUrl,
        fileType: saved.fileType,
        senderId: userId,
        sender: saved.sender,
        chatPublicId,
        channelPublicId,
        createdAt: saved.createdAt,
      }

      // If it's a channel message, we still might want to notify the chat room for unread counts
      if (channelPublicId) {
        socket.to(`channel:${channelPublicId}`).emit("private-message", messagePayload)
        socket.to(`chat:${chatPublicId}`).emit("chat-notification", {
          chatPublicId,
          channelPublicId,
          senderId: userId,
        })
      } else {
        recipients.forEach(({ userId: recipientUserId }) => {
          io.to(`user:${recipientUserId}`).emit("private-message", messagePayload)
          io.to(`user:${recipientUserId}`).emit("chat-notification", {
            chatPublicId,
            senderId: userId,
          })
        })
      }

      if (callback) {
        callback(messagePayload)
      }
    }
  )


  socket.on("chat:typing", async ({ chatPublicId, isTyping }: { chatPublicId: string, isTyping: boolean }) => {
    const allowed = await isUserInChat(userId, chatPublicId)
    if (!allowed) return

    socket.to(`chat:${chatPublicId}`).emit("chat:typing", {
      chatPublicId,
      userId,
      isTyping
    })
  })
}
