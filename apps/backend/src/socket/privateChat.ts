import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma.js";

export function privateChatHandler(io: Server, socket: Socket) {

  // socket.on("join-room", async ({ chatPublicId }: { chatPublicId: number }) => {
  //   const userId = socket.data.userId;
  //
  //   if (!userId || !chatPublicId) return;
  //   // if (userId === friendId) return;
  //
  //   const chat = await prisma.chat.findFirst({
  //     where: {
  //       OR: [
  //         { user1Id: userId, user2Id: chatPublicId },
  //         { user1Id: chatPublicId, user2Id: userId },
  //       ],
  //     },
  //   });
  //
  //   if (!isFriend) return;
  //
  //   const room = `chat-${[userId, chatPublicId].sort().join("-")}`;
  //   socket.join(room);
  // });

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


  // socket.on(
  //   "private-message",
  //   async ({ text, to }: { text: string; to: number }) => {
  //     const from = socket.data.userId;
  //     if (!from || !to || !text.trim()) return;
  //
  //     const isFriend = await prisma.friend.findFirst({
  //       where: {
  //         OR: [
  //           { user1Id: from, user2Id: to },
  //           { user1Id: to, user2Id: from },
  //         ],
  //       },
  //     });
  //
  //     if (!isFriend) return;
  //
  //     const room = `chat-${[from, to].sort().join("-")}`;
  //
  //     const saved = await prisma.message.create({
  //       data: {
  //         text,
  //         senderId: from,
  //         receiverId: to,
  //       },
  //     });
  //
  //     io.to(room).emit("private-message", {
  //       id: saved.id,
  //       text: saved.text,
  //       senderId: from,
  //       receiverId: to,
  //       createdAt: saved.createdAt,
  //     });
  //   }
  // );


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
      const socketsInRoom = await io.in(room).fetchSockets();
      const deliveredInRoom = socketsInRoom.length > 1;

      io.to(room).emit("private-message", {
        id: saved.id,
        text: saved.text,
        senderId: userId,
        chatPublicId: chat.publicId,
        createdAt: saved.createdAt,
        deliveredInRoom,
      });
    }
  );

}

