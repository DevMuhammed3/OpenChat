import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { generateRandomNumericId } from "../utils/generateRandomNumericId.js";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user?.id;

  const chats = await prisma.chat.findMany({
    where: {
      participants: { some: { userId } },
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
  });

  res.json({
    chats: chats.map(chat => ({
      chatPublicId: chat.publicId,
      participants: chat.participants.map(p => p.user),
      lastMessage: chat.messages[0] || null,
    })),
  });
});


router.get("/:chatPublicId/messages", authMiddleware, async (req, res) => {
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
    where: {
      chatId: chat.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.json({ messages });
});


/**
 * Start (or get) chat with a friend
 * POST /chats/start
 */

router.post("/start", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  const { friendId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!friendId || typeof friendId !== "number") {
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

  // const existingChat = await prisma.chat.findFirst({
  //   where: {
  //     participants: {
  //       every: {
  //         userId: {
  //           in: [userId, friendId],
  //         },
  //       },
  //     },
  //   },
  // });

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
        create: [
          { userId },
          { userId: friendId },
        ],
      },
    },
  });

  return res.json({ chatPublicId: chat.publicId });
});

export default router;
