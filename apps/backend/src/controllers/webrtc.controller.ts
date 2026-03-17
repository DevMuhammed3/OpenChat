import { Request, Response } from "express"
import { AccessToken } from "livekit-server-sdk"
import { prisma } from "../config/prisma.js"

export function getIceServers(req: Request, res: Response) {
  res.json({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
    ],
  })
}

export async function getLiveKitToken(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    const { roomType, roomId } = req.query

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    if (roomType !== "dm" && roomType !== "channel") {
      return res.status(400).json({ message: "Invalid room type" })
    }

    if (typeof roomId !== "string" || !roomId.trim()) {
      return res.status(400).json({ message: "roomId is required" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (roomType === "dm") {
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          userId,
          chat: {
            publicId: roomId,
            type: "DM",
          },
        },
        select: { id: true },
      })

      if (!participant) {
        return res.status(403).json({ message: "Forbidden" })
      }
    }

    if (roomType === "channel") {
      const channel = await prisma.channel.findFirst({
        where: {
          publicId: roomId,
          type: "VOICE",
          chat: {
            participants: {
              some: { userId },
            },
          },
        },
        select: { id: true, publicId: true },
      })

      if (!channel) {
        return res.status(403).json({ message: "Forbidden" })
      }
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const serverUrl = process.env.LIVEKIT_URL

    const missingVars = [
      !apiKey && "LIVEKIT_API_KEY",
      !apiSecret && "LIVEKIT_API_SECRET",
      !serverUrl && "LIVEKIT_URL",
    ].filter(Boolean)

    if (missingVars.length > 0) {
      return res.status(500).json({
        message: `LiveKit is not configured: missing ${missingVars.join(", ")}`,
      })
    }

    const roomName = roomType === "dm" ? `dm:${roomId}` : `channel:${roomId}`
    const token = new AccessToken(apiKey, apiSecret, {
      identity: String(user.id),
      name: user.username,
      ttl: "10m",
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    })

    res.json({
      token: await token.toJwt(),
      serverUrl,
      roomName,
    })
  } catch (error) {
    console.error("LIVEKIT TOKEN ERROR:", error)
    res.status(500).json({ message: "Failed to create LiveKit token" })
  }
}
