import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { upload } from "../middlewares/upload.middleware.js";
import { updateAvatar, updateProfile } from "../controllers/user.controller.js";

const router = Router();

router.patch('/profile', authMiddleware, updateProfile)

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

router.patch(
  '/avatar',
  authMiddleware,
  upload.single('avatar'),
  updateAvatar
)

export default router;
