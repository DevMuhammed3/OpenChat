import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma.js";

export function privateChatHandler(io: Server, socket: Socket) {

  socket.on("join-room", async ({ friendId }: { friendId: number }) => {
    const userId = socket.data.userId;

    if (!userId || !friendId) return;
    if (userId === friendId) return;

    const isFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (!isFriend) return;

    const room = `chat-${[userId, friendId].sort().join("-")}`;
    socket.join(room);
  });

  socket.on(
    "private-message",
    async ({ text, to }: { text: string; to: number }) => {
      const from = socket.data.userId;
      if (!from || !to || !text.trim()) return;

      const isFriend = await prisma.friend.findFirst({
        where: {
          OR: [
            { user1Id: from, user2Id: to },
            { user1Id: to, user2Id: from },
          ],
        },
      });

      if (!isFriend) return;

      const room = `chat-${[from, to].sort().join("-")}`;

      const saved = await prisma.message.create({
        data: {
          text,
          senderId: from,
          receiverId: to,
        },
      });

      io.to(room).emit("private-message", {
        id: saved.id,
        text: saved.text,
        senderId: from,
        receiverId: to,
        createdAt: saved.createdAt,
      });
    }
  );
}

