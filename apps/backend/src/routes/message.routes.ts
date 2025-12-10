import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:uid/:fid", authMiddleware, async (req, res) => {
  const uid = Number(req.params.uid);
  const fid = Number(req.params.fid);

  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: uid, receiverId: fid },
        { senderId: fid, receiverId: uid }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  res.json({ messages: msgs });
});

export default router;

