import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { upload } from "../middlewares/upload.middleware.js";
import { updateAvatar, updateProfile, removeAvatar } from "../controllers/user.controller.js";
import { respondWithZodError } from "../utils/zodError.js";
import { usernameParamsSchema, userSearchQuerySchema } from "../validations/user.validation.js";

const router = Router();

router.delete('/avatar', authMiddleware, removeAvatar)
router.patch('/profile', authMiddleware, updateProfile)

router.get("/search", authMiddleware, async (req, res) => {
  const parsed = userSearchQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return respondWithZodError(res, parsed.error)
  }

  const q = parsed.data.q

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


router.get("/:username", authMiddleware, async (req, res) => {
  const parsed = usernameParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return respondWithZodError(res, parsed.error)
  }

  const currentUserId = req.user?.id
  if (!currentUserId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const { username } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      publicNumericId: true,
      isOnline: true,
      lastLogin: true,
      createdAt: true,
    }
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  const targetUserId = user.id

  const [friendship, pendingRequest, currentFriends, targetFriends, currentZones, targetZones] =
    await Promise.all([
      prisma.friend.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: currentUserId },
          ],
        },
        select: { id: true },
      }),
      prisma.friendRequest.findFirst({
        where: {
          status: "PENDING",
          OR: [
            { senderId: currentUserId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: currentUserId },
          ],
        },
        select: { id: true },
      }),
      prisma.friend.findMany({
        where: { OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }] },
        select: { user1Id: true, user2Id: true },
      }),
      prisma.friend.findMany({
        where: { OR: [{ user1Id: targetUserId }, { user2Id: targetUserId }] },
        select: { user1Id: true, user2Id: true },
      }),
      prisma.chatParticipant.findMany({
        where: { userId: currentUserId, chat: { type: "ZONE" } },
        select: { chat: { select: { id: true, publicId: true, name: true } } },
      }),
      prisma.chatParticipant.findMany({
        where: { userId: targetUserId, chat: { type: "ZONE" } },
        select: { chat: { select: { id: true, publicId: true, name: true } } },
      }),
    ])

  const friendStatus = friendship ? "accepted" : pendingRequest ? "pending" : "none"

  const currentFriendIds = new Set(
    currentFriends.map((f) => (f.user1Id === currentUserId ? f.user2Id : f.user1Id)),
  )
  const targetFriendIds = new Set(
    targetFriends.map((f) => (f.user1Id === targetUserId ? f.user2Id : f.user1Id)),
  )
  const mutualFriendIds = [...currentFriendIds].filter((id) => targetFriendIds.has(id))

  const mutualFriends = mutualFriendIds.length
    ? await prisma.user.findMany({
        where: { id: { in: mutualFriendIds } },
        select: { id: true, name: true, username: true },
      })
    : []

  const currentZoneMap = new Map(currentZones.map((entry) => [entry.chat.id, entry.chat]))
  const mutualZones = targetZones
    .map((entry) => currentZoneMap.get(entry.chat.id))
    .filter((zone): zone is { id: number; publicId: string; name: string } => Boolean(zone))
    .map((zone) => ({ id: zone.publicId, name: zone.name }))

  res.json({
    user: {
      id: String(user.id),
      name: user.name ?? user.username,
      avatar: user.avatar,
      bio: user.bio,
      friendStatus,
      mutualFriends: mutualFriends.map((friend) => ({
        id: String(friend.id),
        name: friend.name ?? friend.username,
      })),
      mutualZones,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
});

router.patch(
  '/avatar',
  authMiddleware,
  upload.single('avatar'),
  updateAvatar
)

export default router;
