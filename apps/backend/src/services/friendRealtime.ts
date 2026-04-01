import { Server } from "socket.io"
import { prisma } from "../config/prisma.js"
import { getOnlineFriendIds } from "../socket/presence.js"

function uniqueUserIds(userIds: number[]) {
  return [...new Set(userIds)]
}

async function getFriends(userId: number) {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, username: true, name: true, avatar: true } },
      user2: { select: { id: true, username: true, name: true, avatar: true } },
    },
  })

  return friends.map((friend) => (friend.user1.id === userId ? friend.user2 : friend.user1))
}

async function getIncomingRequests(userId: number) {
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: userId },
    include: {
      sender: { select: { id: true, username: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return requests.map((request) => ({
    id: request.id,
    from: request.sender,
    createdAt: request.createdAt,
  }))
}

async function getPendingRequests(userId: number) {
  const requests = await prisma.friendRequest.findMany({
    where: { senderId: userId },
    include: {
      receiver: { select: { id: true, username: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return requests.map((request) => ({
    id: request.id,
    to: request.receiver,
    createdAt: request.createdAt,
  }))
}

async function getBlockedUsers(userId: number) {
  const blockedUsers = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
        select: { id: true, username: true, name: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return blockedUsers.map((entry) => ({
    ...entry.blocked,
    blockedAt: entry.createdAt,
  }))
}

export async function emitFriendState(io: Server, userId: number) {
  const friends = await getFriends(userId)
  const [incomingRequests, pendingRequests, blockedUsers] = await Promise.all([
    getIncomingRequests(userId),
    getPendingRequests(userId),
    getBlockedUsers(userId),
  ])

  io.to(`user:${userId}`).emit("friends:list", { friends })
  io.to(`user:${userId}`).emit("friend:requests:list", {
    requests: incomingRequests,
  })
  io.to(`user:${userId}`).emit("friend:pending:list", {
    requests: pendingRequests,
  })
  io.to(`user:${userId}`).emit("friend:blocked:list", {
    blocked: blockedUsers,
  })
  io.to(`user:${userId}`).emit("friends:online", getOnlineFriendIds(friends.map((friend) => friend.id)))
}

export async function emitFriendStateToUsers(io: Server, userIds: number[]) {
  await Promise.all(uniqueUserIds(userIds).map((userId) => emitFriendState(io, userId)))
}
