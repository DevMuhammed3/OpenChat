import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, name: true, avatar: true }
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
});

export default router;

