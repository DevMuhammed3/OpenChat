import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { generateRandomNumericId } from "../utils/generateRandomNumericId.js";
import { io } from "../index.js"
import multer from "multer"
import path from "path"
import fs from "fs"
import crypto from "crypto"

const uploadDir = "uploads"

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    cb(null, crypto.randomUUID() + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only images allowed"))
    } else {
      cb(null, true)
    }
  }
})

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

    const { cursor, channelPublicId } = req.query as { cursor?: string; channelPublicId?: string }

    let channelId: number | undefined
    if (channelPublicId) {
      const channel = await prisma.channel.findUnique({
        where: { publicId: channelPublicId },
        select: { id: true }
      })
      channelId = channel?.id
    }

    const messages = await prisma.message.findMany({
      where: { 
        chatId: chat.id,
        ...(channelId !== undefined ? { channelId } : { channelId: null })
      },
      take: 50,
      ...(cursor && {
        cursor: { id: Number(cursor) },
        skip: 1
      }),
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
      },
      orderBy: { id: "desc" }
    })

    const safeMessages = messages.map(msg =>
      msg.isDeleted
        ? { ...msg, text: null, fileUrl: null, fileType: null }
        : msg
    )

    res.json({ messages: safeMessages });
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
        type: "DM",
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
    });

    res.json({
      chats: chats.map((chat: any) => ({
        chatPublicId: chat.publicId,
        type: chat.type,
        name: chat.name,
        avatar: chat.avatar ?? null,
        participants: chat.participants.map((p: any) => p.user),
        lastMessage: chat.messages?.[0] ?? null,
      })),
    })
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
        type: "DM",
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: friendId } } }
        ]
      }
    })

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

export const uploadFile = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      const { chatPublicId } = req.params

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
      }

      const chat = await prisma.chat.findUnique({
        where: { publicId: chatPublicId },
        include: {
          participants: {
            where: { userId },
          },
        },
      })

      if (!chat || chat.participants.length === 0) {
        return res.status(403).json({ message: "Forbidden" })
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" })
      }

      const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`

      return res.json({
        fileUrl,
        fileType: req.file.mimetype,
      })

    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Internal server error" })
    }
  },
]


/**
 * PATCH /messages/:id
 */
export const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = Number(req.params.id);
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: {
            publicId: true
          }
        },
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit deleted message" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        text,
        isEdited: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    io.to(`chat:${message.chat.publicId}`).emit(
      "message:updated",
      updated
    );
    res.json({ message: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /messages/:id
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isInteger(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Message already deleted" });
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: null,
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    io.to(`chat:${message.chat.publicId}`).emit("message:deleted", {
      id: deleted.id,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

