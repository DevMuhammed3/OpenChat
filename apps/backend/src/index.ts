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

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)

  clearInterval(presenceCleanup)

  server.close(async (err) => {
    if (err) {
      console.error('Error closing server:', err)
      process.exit(1)
    }

    console.log('HTTP server closed.')

    try {
      await prisma.$disconnect()
      console.log('Database connection closed.')
      process.exit(0)
    } catch (dbErr) {
      console.error('Error during database disconnection:', dbErr)
      process.exit(1)
    }
  })

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

process.on("exit", () => {
  clearInterval(presenceCleanup)
})
