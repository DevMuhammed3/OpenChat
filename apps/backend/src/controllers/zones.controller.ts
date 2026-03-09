import { Request, Response } from "express"
import { prisma } from "../config/prisma.js"
import crypto from "crypto"
import multer from "multer"
import path from "path"
import fs from "fs"
import { ZoneRole } from "@prisma/client"

const uploadDir = "uploads/zones"
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(file.mimetype.startsWith("image/") ? null : new Error("Only images allowed"), true)
})

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
    const { chatPublicId } = req.params
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
        avatar: p.user.avatar ? `${process.env.BASE_URL}/uploads/zones/${p.user.avatar}` : null,
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
      const { name, users } = req.body as { name: string; users?: number[] }
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
          }
        },
        include: { participants: true }
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
      const { chatPublicId } = req.params
      if (!userId) return res.status(401).json({ message: "Unauthorized" })
      const dataToUpdate: any = { name: req.body.name }
      if (req.file) dataToUpdate.avatar = req.file.filename
      const updatedZone = await prisma.chat.update({
        where: { publicId: chatPublicId },
        data: dataToUpdate
      })
      res.json({
        zone: {
          publicId: updatedZone.publicId,
          name: updatedZone.name,
          avatar: updatedZone.avatar ? `${process.env.BASE_URL}/uploads/zones/${updatedZone.avatar}` : null
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
    const { chatPublicId } = req.params
    const { userIds } = req.body as { userIds: number[] }
    if (!userIds?.length) return res.status(400).json({ message: "No users provided" })
    const chat = await prisma.chat.findUnique({ where: { publicId: chatPublicId } })
    if (!chat) return res.status(404).json({ message: "Chat not found" })
    await prisma.chatParticipant.createMany({
      data: userIds.map(id => ({ chatId: chat.id, userId: id, role: ZoneRole.MEMBER })),
      skipDuplicates: true
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to add users" })
  }
}

export const removeUserFromGroup = async (req: Request, res: Response) => {
  try {
    const { chatPublicId } = req.params
    const userId = Number(req.params.userId)
    const chat = await prisma.chat.findUnique({ where: { publicId: chatPublicId } })
    if (!chat) return res.status(404).json({ message: "Chat not found" })
    await prisma.chatParticipant.delete({ where: { chatId_userId: { chatId: chat.id, userId } } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to remove user" })
  }
}

export const leaveZone = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { chatPublicId } = req.params
    if (!userId) return res.status(401).json({ message: "Unauthorized" })
    const chat = await prisma.chat.findUnique({ where: { publicId: chatPublicId } })
    if (!chat) return res.status(404).json({ message: "Zone not found" })
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId: chat.id, userId } } })
    if (!participant) return res.status(404).json({ message: "You are not a member" })
    if (participant.role === ZoneRole.OWNER) return res.status(400).json({ message: "Owner cannot leave zone" })
    await prisma.chatParticipant.delete({ where: { chatId_userId: { chatId: chat.id, userId } } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to leave zone" })
  }
}
