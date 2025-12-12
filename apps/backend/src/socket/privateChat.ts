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

  // JOIN ROOM
  socket.on("join-room", async ({ userId, friendId }: JoinRoomPayload) => {

    const isFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId }
        ]
      }
    });

    if (!isFriend) {
      console.log(`User ${userId} tried to join room with ${friendId} but NOT friends.`);
      return;
    }

    const room = `chat-${[userId, friendId].sort().join("-")}`;
    socket.join(room);

    console.log(`User ${userId} joined room ${room}`);
  });

  // SEND MESSAGE
  socket.on("private-message", async ({ text, from, to }: PrivateMessagePayload) => {

    const isFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: from, user2Id: to },
          { user1Id: to, user2Id: from }
        ]
      }
    });

    if (!isFriend) {
      console.log(`User ${from} tried to send message to ${to} but NOT friends.`);
      return;
    }

    const room = `chat-${[from, to].sort().join("-")}`;

    const saved = await prisma.message.create({
      data: {
        text,
        senderId: from,
        receiverId: to,
      }
    });

    // Send to sender
    socket.emit("private-message", saved);

    // Send to receiver
    socket.to(room).emit("private-message", saved);
  });

}

