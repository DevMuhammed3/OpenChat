import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { upload } from "../middlewares/upload.middleware.js";
import { updateAvatar, updateProfile, removeAvatar } from "../controllers/user.controller.js";

const router = Router();

router.delete('/avatar', authMiddleware, removeAvatar)
router.patch('/profile', authMiddleware, updateProfile)

router.get("/search", authMiddleware, async (req, res) => {
  const q = req.query.q as string

  if (!q) return res.json({ users: [] })

  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: q,
        mode: "insensitive"
      }
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      name: true
    },
    take: 10
  })

  res.json({ users })
})


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
