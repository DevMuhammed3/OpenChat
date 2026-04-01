import { Request, Response } from "express"
import { prisma } from "../config/prisma.js"
import crypto from "crypto"
import multer from "multer"
import path from "path"
import fs from "fs"
import { ZoneRole } from "@prisma/client"
import { resolveAssetUrl } from "../utils/resolveAssetUrl.js"
import { getChannelCallPresence } from "../socket/channelCallHandler.js"
import { io } from "../index.js"
import { respondWithZodError } from "../utils/zodError.js"
import {
  addUsersBodySchema,
  createChannelBodySchema,
  createGroupBodySchema,
  updateMemberRoleBodySchema,
  updateZoneBodySchema,
  zoneChatPublicIdParamsSchema,
  zoneInviteCodeParamsSchema,
  zoneMemberParamsSchema,
} from "../validations/zones.validation.js"

const uploadDir = "uploads/zones"
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"))
    }

    cb(null, true)
  }
})

async function getZoneAndParticipant(chatPublicId: string, userId: number) {
  const chat = await prisma.chat.findUnique({
    where: { publicId: chatPublicId },
    include: {
      participants: {
        where: { userId },
      },
    },
  })

  if (!chat) return { chat: null, participant: null }

  return {
    chat,
    participant: chat.participants[0] ?? null,
  }
}

async function buildZoneMembers(chatId: number) {
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { userId: "asc" },
    ],
  })

  return participants.map((participant) => ({
    id: participant.user.id,
    username: participant.user.username,
    avatar: participant.user.avatar ?? null,
    role: participant.role,
  }))
}

async function emitZoneMembersUpdate(chatPublicId: string, chatId: number) {
  const members = await buildZoneMembers(chatId)
  io.to(`chat:${chatPublicId}`).emit("zone:members-updated", {
    chatPublicId,
    members,
  })
}

function emitZoneChannelsUpdate(chatPublicId: string) {
  io.to(`chat:${chatPublicId}`).emit("zone:channels-updated", {
    chatPublicId,
  })
}

async function emitZoneUpdated(chatPublicId: string) {
  const zone = await prisma.chat.findUnique({
    where: { publicId: chatPublicId },
    select: { publicId: true, name: true, avatar: true, type: true },
  })

  if (!zone || zone.type !== "ZONE") return

  io.to(`chat:${chatPublicId}`).emit("zone:updated", {
    zone: {
      publicId: zone.publicId,
      name: zone.name,
      avatar: resolveAssetUrl(zone.avatar ? `/uploads/zones/${zone.avatar}` : null),
    },
  })
}

export const getZones = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: "Unauthorized" })
    const zones = await prisma.chat.findMany({
      where: { type: "ZONE", participants: { some: { userId } } },
      select: { publicId: true, name: true, avatar: true },
      orderBy: { createdAt: "desc" }
    })
    res.json({
      zones: zones.map(z => ({
        ...z,
        avatar: z.avatar ? `${process.env.BASE_URL}/uploads/zones/${z.avatar}` : null
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch zones" })
  }
}

export const getZoneMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data
    if (!userId) return res.status(401).json({ message: "Unauthorized" })
    const chat = await prisma.chat.findUnique({ where: { publicId: chatPublicId } })
    if (!chat) return res.status(404).json({ message: "Zone not found" })
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: chat.id, userId } }
    })
    if (!participant) return res.status(403).json({ message: "Forbidden" })
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId: chat.id },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { role: "asc" }
    })
    res.json({
      members: participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        avatar: p.user.avatar ?? null,
        role: p.role
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch zone members" })
  }
}

export const createGroup = [
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ message: "Unauthorized" })
      const parsedBody = createGroupBodySchema.safeParse(req.body)
      if (!parsedBody.success) {
        return respondWithZodError(res, parsedBody.error)
      }
      const { name, users } = parsedBody.data
      if (!name?.trim()) return res.status(400).json({ message: "Group name required" })
      const creatorId = userId
      const uniqueUsers = [...new Set(users || [])].filter(id => id !== creatorId)
      if (uniqueUsers.length > 50) return res.status(400).json({ message: "Group member limit exceeded" })
      const validUsers = await prisma.user.findMany({ where: { id: { in: uniqueUsers } }, select: { id: true } })
      if (validUsers.length !== uniqueUsers.length) return res.status(400).json({ message: "Some users do not exist" })
      const avatarUrl = req.file ? req.file.filename : null
      const chat = await prisma.chat.create({
        data: {
          publicId: crypto.randomUUID(),
          type: "ZONE",
          name,
          avatar: avatarUrl,
          createdBy: creatorId,
          participants: {
            create: [
              { userId: creatorId, role: ZoneRole.OWNER },
              ...validUsers.map(u => ({ userId: u.id, role: ZoneRole.MEMBER }))
            ]
          },
          channels: {
            create: [
              { publicId: crypto.randomUUID(), name: "general", type: "TEXT" }
            ]
          }
        },
        include: { participants: true, channels: true }
      })
      res.json({
        zone: {
          publicId: chat.publicId,
          name: chat.name,
          avatar: chat.avatar ? `${process.env.BASE_URL}/uploads/zones/${chat.avatar}` : null
        }
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Failed to create group" })
    }
  }
]

export const updateZone = [
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id
      const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
      if (!parsedParams.success) {
        return respondWithZodError(res, parsedParams.error)
      }
      const { chatPublicId } = parsedParams.data
      if (!userId) return res.status(401).json({ message: "Unauthorized" })
      const { chat, participant } = await getZoneAndParticipant(chatPublicId, userId)
      if (!chat || chat.type !== "ZONE") return res.status(404).json({ message: "Zone not found" })
      if (!participant || (participant.role !== ZoneRole.OWNER && participant.role !== ZoneRole.ADMIN)) {
        return res.status(403).json({ message: "Only managers can update the zone" })
      }

      const dataToUpdate: { name?: string; avatar?: string } = {}
      const parsedBody = updateZoneBodySchema.safeParse(req.body)
      if (!parsedBody.success) {
        return respondWithZodError(res, parsedBody.error)
      }
      const nextName = parsedBody.data.name?.trim() ?? ""
      if (nextName) dataToUpdate.name = nextName
      if (req.file) dataToUpdate.avatar = req.file.filename
      if (!dataToUpdate.name && !dataToUpdate.avatar) {
        return res.status(400).json({ message: "Nothing to update" })
      }

      const updatedZone = await prisma.chat.update({
        where: { publicId: chatPublicId },
        data: dataToUpdate
      })

      await emitZoneUpdated(chatPublicId)

      res.json({
        zone: {
          publicId: updatedZone.publicId,
          name: updatedZone.name,
          avatar: resolveAssetUrl(updatedZone.avatar ? `/uploads/zones/${updatedZone.avatar}` : null)
        }
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Failed to update zone" })
    }
  }
]

export const addUserToGroup = async (req: Request, res: Response) => {
  try {
    const actorId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data

    const parsedBody = addUsersBodySchema.safeParse(req.body)
    if (!parsedBody.success) {
      return respondWithZodError(res, parsedBody.error)
    }
    const { userIds } = parsedBody.data
    if (!actorId) return res.status(401).json({ message: "Unauthorized" })
    const { chat, participant } = await getZoneAndParticipant(chatPublicId, actorId)
    if (!chat || chat.type !== "ZONE") return res.status(404).json({ message: "Chat not found" })
    if (!participant || (participant.role !== ZoneRole.OWNER && participant.role !== ZoneRole.ADMIN)) {
      return res.status(403).json({ message: "Only managers can add members" })
    }
    await prisma.chatParticipant.createMany({
      data: userIds.map(id => ({ chatId: chat.id, userId: id, role: ZoneRole.MEMBER })),
      skipDuplicates: true
    })
    await emitZoneMembersUpdate(chatPublicId, chat.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to add users" })
  }
}

export const removeUserFromGroup = async (req: Request, res: Response) => {
  try {
    const actorId = req.user?.id
    const parsedParams = zoneMemberParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId, userId } = parsedParams.data
    if (!actorId) return res.status(401).json({ message: "Unauthorized" })
    const { chat, participant } = await getZoneAndParticipant(chatPublicId, actorId)
    if (!chat || chat.type !== "ZONE") return res.status(404).json({ message: "Chat not found" })
    if (!participant || (participant.role !== ZoneRole.OWNER && participant.role !== ZoneRole.ADMIN)) {
      return res.status(403).json({ message: "Only managers can remove members" })
    }
    if (actorId === userId) return res.status(400).json({ message: "Use leave zone instead" })

    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: chat.id, userId } },
    })
    if (!target) return res.status(404).json({ message: "Member not found" })
    if (target.role === ZoneRole.OWNER) return res.status(403).json({ message: "Owner cannot be removed" })
    if (participant.role === ZoneRole.ADMIN && target.role === ZoneRole.ADMIN) {
      return res.status(403).json({ message: "Admins cannot remove other admins" })
    }

    await prisma.chatParticipant.delete({ where: { chatId_userId: { chatId: chat.id, userId } } })
    await emitZoneMembersUpdate(chatPublicId, chat.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to remove user" })
  }
}

export const leaveZone = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data
    if (!userId) return res.status(401).json({ message: "Unauthorized" })
    const chat = await prisma.chat.findUnique({ where: { publicId: chatPublicId } })
    if (!chat) return res.status(404).json({ message: "Zone not found" })
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId: chat.id, userId } } })
    if (!participant) return res.status(404).json({ message: "You are not a member" })
    if (participant.role === ZoneRole.OWNER) return res.status(400).json({ message: "Owner cannot leave zone" })
    await prisma.chatParticipant.delete({ where: { chatId_userId: { chatId: chat.id, userId } } })
    await emitZoneMembersUpdate(chatPublicId, chat.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to leave zone" })
  }
}

export const getZoneChannels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: { where: { userId } },
        channels: true
      }
    })

    if (!chat || chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" })
    }

    res.json({ channels: chat.channels })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch channels" })
  }
}

export const getZoneVoicePresence = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data
    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: { where: { userId } },
        channels: {
          where: { type: "VOICE" },
          select: { publicId: true, name: true },
        },
      },
    })

    if (!chat || chat.type !== "ZONE" || chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" })
    }

    const presence = getChannelCallPresence(chat.channels.map((channel) => channel.publicId))
    res.json({ channels: presence })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch voice presence" })
  }
}

export const createZoneInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data

    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: {
          where: { userId },
        },
      },
    })

    if (!chat || chat.type !== "ZONE" || chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" })
    }

    const invite = await prisma.chatInvite.create({
      data: {
        code: crypto.randomBytes(6).toString("base64url"),
        chatId: chat.id,
        createdBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: {
        code: true,
        expiresAt: true,
      },
    })

    res.json({
      invite: {
        ...invite,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create invite" })
  }
}

export const getZoneInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneInviteCodeParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { code } = parsedParams.data

    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const invite = await prisma.chatInvite.findUnique({
      where: { code },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId },
            },
            _count: {
              select: { participants: true },
            },
          },
        },
      },
    })

    if (!invite || invite.chat.type !== "ZONE") {
      return res.status(404).json({ message: "Invite not found" })
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Invite expired" })
    }

    res.json({
      invite: {
        code: invite.code,
        expiresAt: invite.expiresAt,
        zone: {
          publicId: invite.chat.publicId,
          name: invite.chat.name,
          avatar: invite.chat.avatar ? resolveAssetUrl(`/uploads/zones/${invite.chat.avatar}`) : null,
          memberCount: invite.chat._count.participants,
        },
        isMember: invite.chat.participants.length > 0,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch invite" })
  }
}

export const joinZoneInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneInviteCodeParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { code } = parsedParams.data

    if (!userId) return res.status(401).json({ message: "Unauthorized" })

    const invite = await prisma.chatInvite.findUnique({
      where: { code },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!invite || invite.chat.type !== "ZONE") {
      return res.status(404).json({ message: "Invite not found" })
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Invite expired" })
    }

    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res.status(410).json({ message: "Invite exhausted" })
    }

    if (invite.chat.participants.length === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.chatParticipant.create({
          data: {
            chatId: invite.chat.id,
            userId,
            role: ZoneRole.MEMBER,
          },
        })

        await tx.chatInvite.update({
          where: { code },
          data: { uses: { increment: 1 } },
        })
      })

      await emitZoneMembersUpdate(invite.chat.publicId, invite.chat.id)
    }

    res.json({
      zone: {
        publicId: invite.chat.publicId,
        name: invite.chat.name,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to join invite" })
  }
}

export const createChannel = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const parsedParams = zoneChatPublicIdParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId } = parsedParams.data

    const parsedBody = createChannelBodySchema.safeParse(req.body)
    if (!parsedBody.success) {
      return respondWithZodError(res, parsedBody.error)
    }
    const { name, type } = parsedBody.data

    if (!userId) return res.status(401).json({ message: "Unauthorized" })
    if (!name?.trim()) return res.status(400).json({ message: "Channel name required" })

    const chat = await prisma.chat.findUnique({
      where: { publicId: chatPublicId },
      include: {
        participants: { where: { userId } }
      }
    })

    if (!chat || chat.participants.length === 0) {
      return res.status(403).json({ message: "Forbidden" })
    }

    const participant = chat.participants[0]
    if (participant.role !== ZoneRole.OWNER && participant.role !== ZoneRole.ADMIN) {
      return res.status(403).json({ message: "Only managers can create channels" })
    }

    const channel = await prisma.channel.create({
      data: {
        publicId: crypto.randomUUID(),
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type: type || "TEXT",
        chatId: chat.id
      }
    })

    emitZoneChannelsUpdate(chatPublicId)
    res.json({ channel })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create channel" })
  }
}

export const updateZoneMemberRole = async (req: Request, res: Response) => {
  try {
    const actorId = req.user?.id
    const parsedParams = zoneMemberParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      return respondWithZodError(res, parsedParams.error)
    }
    const { chatPublicId, userId } = parsedParams.data

    const parsedBody = updateMemberRoleBodySchema.safeParse(req.body)
    if (!parsedBody.success) {
      return respondWithZodError(res, parsedBody.error)
    }
    const { role } = parsedBody.data

    if (!actorId) return res.status(401).json({ message: "Unauthorized" })

    const { chat, participant } = await getZoneAndParticipant(chatPublicId, actorId)
    if (!chat || chat.type !== "ZONE") return res.status(404).json({ message: "Zone not found" })
    if (!participant || (participant.role !== ZoneRole.OWNER && participant.role !== ZoneRole.ADMIN)) {
      return res.status(403).json({ message: "Only managers can update roles" })
    }

    const targetUserId = userId
    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: chat.id, userId: targetUserId } },
    })

    if (!target) return res.status(404).json({ message: "Member not found" })
    if (target.role === ZoneRole.OWNER) {
      return res.status(403).json({ message: "Owner role cannot be changed" })
    }
    if (participant.role === ZoneRole.ADMIN) {
      return res.status(403).json({ message: "Only owner can change roles" })
    }

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId: chat.id, userId: targetUserId } },
      data: { role },
    })

    await emitZoneMembersUpdate(chatPublicId, chat.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to update role" })
  }
}
