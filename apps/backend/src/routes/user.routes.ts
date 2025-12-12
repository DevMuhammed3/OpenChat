import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/:username", async (req, res) => {
  const username = req.params.username;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      publicNumericId: true
    }
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
});

export default router;

