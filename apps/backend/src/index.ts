import http from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { privateChatHandler } from './socket/privateChat.js'
import { isAllowedOrigin } from './config/origin.js'
import { socketAuth } from './socket/auth.js'

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

io.on('connection', (socket) => {
  const userId = socket.data.userId

  console.log(`Socket connected: ${socket.id} (user ${userId})`)

  socket.join(userId.toString())

  privateChatHandler(io, socket)

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} (user ${userId})`)
  })
})

server.listen(port, () => {
  console.log('Socket + API running on http://localhost:' + port)
})

