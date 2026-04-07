import { Server } from "socket.io"
import { prisma } from "../config/prisma.js"

const userConnections = new Map<number, Map<string, number>>()
const zoneOnlineUsers = new Map<string, Set<number>>()
const userZones = new Map<number, Set<string>>()

const STALE_CONNECTION_MS = 45000
const CLEANUP_INTERVAL_MS = 15000

export function getZoneOnlineUsers(zonePublicId: string): number[] {
  const users = zoneOnlineUsers.get(zonePublicId)
  return users ? Array.from(users) : []
}

export function addUserToZone(zonePublicId: string, userId: number) {
  let users = zoneOnlineUsers.get(zonePublicId)
  if (!users) {
    users = new Set()
    zoneOnlineUsers.set(zonePublicId, users)
  }
  users.add(userId)

  let zones = userZones.get(userId)
  if (!zones) {
    zones = new Set()
    userZones.set(userId, zones)
  }
  zones.add(zonePublicId)
}

export function removeUserFromZone(zonePublicId: string, userId: number) {
  const users = zoneOnlineUsers.get(zonePublicId)
  if (users) {
    users.delete(userId)
    if (users.size === 0) {
      zoneOnlineUsers.delete(zonePublicId)
    }
  }

  const zones = userZones.get(userId)
  if (zones) {
    zones.delete(zonePublicId)
    if (zones.size === 0) {
      userZones.delete(userId)
    }
  }
}

export function removeUserFromAllZones(userId: number) {
  const zones = userZones.get(userId)
  if (zones) {
    zones.forEach((zonePublicId) => {
      const users = zoneOnlineUsers.get(zonePublicId)
      if (users) {
        users.delete(userId)
        if (users.size === 0) {
          zoneOnlineUsers.delete(zonePublicId)
        }
      }
    })
    userZones.delete(userId)
  }
}

async function getFriendIds(userId: number) {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    select: {
      user1Id: true,
      user2Id: true,
    },
  })

  return friends.map((friend) => (friend.user1Id === userId ? friend.user2Id : friend.user1Id))
}

async function setUserOnlineState(io: Server, userId: number, isOnline: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline },
  })

  const friendIds = await getFriendIds(userId)
  const eventName = isOnline ? "user:online" : "user:offline"

  friendIds.forEach((friendId) => {
    io.to(`user:${friendId}`).emit(eventName, { userId })
  })
}

export function isUserOnline(userId: number) {
  const sockets = userConnections.get(userId)
  return Boolean(sockets && sockets.size > 0)
}

export function getOnlineFriendIds(friendIds: number[]) {
  return friendIds.filter((friendId) => isUserOnline(friendId))
}

export async function registerConnection(io: Server, userId: number, socketId: string) {
  const sockets = userConnections.get(userId) ?? new Map<string, number>()
  const wasOnline = sockets.size > 0

  sockets.set(socketId, Date.now())
  userConnections.set(userId, sockets)

  if (!wasOnline) {
    await setUserOnlineState(io, userId, true)
  }
}

export function refreshConnection(userId: number, socketId: string) {
  const sockets = userConnections.get(userId)
  if (!sockets?.has(socketId)) return

  sockets.set(socketId, Date.now())
}

export async function unregisterConnection(io: Server, userId: number, socketId: string) {
  const sockets = userConnections.get(userId)
  if (!sockets) return

  sockets.delete(socketId)

  if (sockets.size > 0) {
    userConnections.set(userId, sockets)
    return
  }

  userConnections.delete(userId)
  await setUserOnlineState(io, userId, false)

  const zones = userZones.get(userId)
  if (zones) {
    zones.forEach((zonePublicId) => {
      const users = zoneOnlineUsers.get(zonePublicId)
      if (users) {
        users.delete(userId)
        if (users.size === 0) {
          zoneOnlineUsers.delete(zonePublicId)
        }
        io.to(`zone:${zonePublicId}`).emit("zone:presence", {
          zonePublicId,
          onlineUsers: Array.from(zoneOnlineUsers.get(zonePublicId) || []),
        })
      }
    })
    userZones.delete(userId)
  }
}

export async function resetPresenceState() {
  userConnections.clear()
  zoneOnlineUsers.clear()
  userZones.clear()
  await prisma.user.updateMany({
    data: { isOnline: false },
  })
}

export function startPresenceCleanup(io: Server) {
  return setInterval(async () => {
    const cutoff = Date.now() - STALE_CONNECTION_MS
    const removals: Array<{ userId: number; socketId: string }> = []

    userConnections.forEach((sockets, userId) => {
      sockets.forEach((lastSeen, socketId) => {
        if (lastSeen < cutoff) {
          removals.push({ userId, socketId })
        }
      })
    })

    for (const removal of removals) {
      const socket = io.sockets.sockets.get(removal.socketId)
      if (socket?.connected) {
        refreshConnection(removal.userId, removal.socketId)
        continue
      }

      await unregisterConnection(io, removal.userId, removal.socketId)
    }
  }, CLEANUP_INTERVAL_MS)
}
