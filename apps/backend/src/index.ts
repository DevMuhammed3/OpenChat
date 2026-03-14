import "dotenv/config"
import http from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { privateChatHandler } from './socket/privateChat.js'
import { isAllowedOrigin } from './config/origin.js'
import { socketAuth } from './socket/auth.js'
import { prisma } from './config/prisma.js'
import { callHandler } from "./socket/callHandler.js"

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

io.on('connection', async (socket) => {
  const userId = socket.data.userId
  if (!userId) return

  console.log(`Socket connected: ${socket.id} (user ${userId})`)


  socket.join(`user:${userId}`)

  // Update online status and notify friends
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true },
  })

  const friendsList = await prisma.friend.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  })

  const friendIds = friendsList.map((f) =>
    f.user1Id === userId ? f.user2Id : f.user1Id
  )

  friendIds.forEach((id) => {
    io.to(`user:${id}`).emit("user:online", { userId })
  })

  // Send current online friends to the user
  const onlineFriends = await prisma.user.findMany({
    where: {
      id: { in: friendIds },
      isOnline: true,
    },
    select: { id: true },
  })
  socket.emit("friends:online", onlineFriends.map(f => f.id))

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

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id} (user ${userId})`)

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    })

    friendIds.forEach((id) => {
      io.to(`user:${id}`).emit("user:offline", { userId })
    })
  })
})

server.listen(port, () => {
  console.log('Socket + API running on http://localhost:' + port)
})
