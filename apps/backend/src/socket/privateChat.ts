import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma.js";

export function privateChatHandler(io: Server, socket: Socket) {

  socket.on("join-room", async ({ chatPublicId }: { chatPublicId: string }) => {
    const userId = socket.data.userId;
    if (!userId || !chatPublicId) return;

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!chat || chat.participants.length === 0) return;
    socket.join(`chat:${chat.publicId}`);
  });


  socket.on(
    "private-message",
    async ({ chatPublicId, text }: { chatPublicId: string; text: string }) => {
      const userId = socket.data.userId;
      if (!userId || !text.trim()) return;

      const chat = await prisma.chat.findUnique({
        where: { publicId: chatPublicId },
        include: {
          participants: {
            where: { userId },
          },
        },
      });

      if (!chat || chat.participants.length === 0) return;

      const saved = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: userId,
          text,
        },
      });


      const room = `chat:${chat.publicId}`;
      // const socketsInRoom = await io.in(room).fetchSockets();
      // const deliveredInRoom = socketsInRoom.length > 1;

      socket.to(room).emit("private-message", {
        id: saved.id,
        text: saved.text,
        senderId: userId,
        chatPublicId: chat.publicId,
        createdAt: saved.createdAt,
      })

      socket.to(room).emit("chat-notification", {
        chatPublicId: chat.publicId,
        senderId: userId,
      })

    }
  );

}

