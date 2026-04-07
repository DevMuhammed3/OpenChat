import "dotenv/config"
import http from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { privateChatHandler } from './socket/privateChat.js'
import { isAllowedOrigin } from './config/origin.js'
import { socketAuth } from './socket/auth.js'
import { prisma } from './config/prisma.js'
import { callHandler } from "./socket/callHandler.js"
import { channelCallHandler } from "./socket/channelCallHandler.js"
import {
  refreshConnection,
  registerConnection,
  resetPresenceState,
  startPresenceCleanup,
  unregisterConnection,
  addUserToZone,
  removeUserFromZone,
  getZoneOnlineUsers,
} from "./socket/presence.js"
import { emitFriendState } from "./services/friendRealtime.js"

const port = process.env.PORT || 4000

const server = http.createServer(app)

export const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  },
})

io.use(socketAuth)

await resetPresenceState()
const presenceCleanup = startPresenceCleanup(io)

io.on('connection', async (socket) => {
  const userId = socket.data.userId
  if (!userId) return

  socket.join(`user:${userId}`)
  await registerConnection(io, userId, socket.id)
  await emitFriendState(io, userId)

  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    select: {
      publicId: true,
    },
  })

  for (const chat of chats) {
    socket.join(`chat:${chat.publicId}`)
  }

  privateChatHandler(io, socket)
  callHandler(io, socket)
  channelCallHandler(io, socket)

  socket.onAny(() => {
    refreshConnection(userId, socket.id)
  })

  socket.on("presence:heartbeat", () => {
    refreshConnection(userId, socket.id)
  })

  socket.on("zone:join", (data: { zonePublicId: string }) => {
    const { zonePublicId } = data
    if (!zonePublicId) return

    socket.join(`zone:${zonePublicId}`)
    addUserToZone(zonePublicId, userId)

    const onlineUsers = getZoneOnlineUsers(zonePublicId)
    io.to(`zone:${zonePublicId}`).emit("zone:presence", {
      zonePublicId,
      onlineUsers,
    })
  })

  socket.on("zone:leave", (data: { zonePublicId: string }) => {
    const { zonePublicId } = data
    if (!zonePublicId) return

    socket.leave(`zone:${zonePublicId}`)
    removeUserFromZone(zonePublicId, userId)

    const onlineUsers = getZoneOnlineUsers(zonePublicId)
    io.to(`zone:${zonePublicId}`).emit("zone:presence", {
      zonePublicId,
      onlineUsers,
    })
  })

  socket.on('disconnect', async () => {
    await unregisterConnection(io, userId, socket.id)
  })
})

server.listen(port, () => { console.log(`Server running on port ${port}`) })

process.on("exit", () => {
  clearInterval(presenceCleanup)
})
