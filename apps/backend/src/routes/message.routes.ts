import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:fid", authMiddleware, async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;
  const friendId = Number(req.params.fid);

  if (isNaN(friendId)) {
    return res.status(400).json({ message: "Invalid friend id" });
  }

  const isFriend = await prisma.friend.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: friendId },
        { user1Id: friendId, user2Id: userId }
      ]
    }
  });

  if (!isFriend) {
    return res.status(403).json({ message: "Not friends" });
  }

  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  res.json({ messages: msgs });
});

export default router;

