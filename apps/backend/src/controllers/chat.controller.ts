import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { generateRandomNumericId } from "../utils/generateRandomNumericId.js";

/**
 * GET /chats/:chatPublicId/messages
 */
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { chatPublicId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!chat || chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /chats
 */
export const getChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      chats: chats.map((chat: any) => ({
        chatPublicId: chat.publicId,
        participants: chat.participants.map((p: any) => p.user),
        lastMessage: chat.messages?.[0] ?? null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /chats/start
 */
export const startChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const friendId = Number(req.body.friendId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(friendId)) {
      return res.status(400).json({ message: "Invalid friendId" });
    }

    const isFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (!isFriend) {
      return res.status(403).json({ message: "Not friends" });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: friendId } } },
        ],
      },
    });

    if (existingChat) {
      return res.json({ chatPublicId: existingChat.publicId });
    }

    const chat = await prisma.chat.create({
      data: {
        publicId: generateRandomNumericId(),
        participants: {
          create: [{ userId }, { userId: friendId }],
        },
      },
    });

    res.json({ chatPublicId: chat.publicId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

