import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma.js";

interface PrivateMessagePayload {
  text: string;
  from: number;
  to: number;
}

interface JoinRoomPayload {
  userId: number;
  friendId: number;
}

export function privateChatHandler(io: Server, socket: Socket) {

  socket.on("join-room", ({ userId, friendId }: JoinRoomPayload) => {
    const room = [userId, friendId].sort().join("-");
    socket.join(room);
  });

  socket.on("private-message", async ({ text, from, to }: PrivateMessagePayload) => {
    const room = [from, to].sort().join("-");

    const saved = await prisma.message.create({
      data: {
        text,
        senderId: from,
        receiverId: to,
      }
    });

    io.to(room).emit("private-message", saved);
  });

}

