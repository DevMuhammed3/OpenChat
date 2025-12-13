import http from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { privateChatHandler } from './socket/privateChat.js'
import { isAllowedOrigin } from './config/origin.js'

const port = process.env.PORT || 4000

// Create HTTP server
const server = http.createServer(app)

// Create Socket.io server
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

// Handle socket connections
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)
    let registered = false

    // Register each user to their private notification room
    socket.on('register', (userId) => {
        if (!userId) return
        registered = true
        socket.join(userId.toString())
        console.log(`User ${userId} joined their personal room`)
        socket.emit('registered')
    })

    // Chat logic
    privateChatHandler(io, socket)

    socket.on('disconnect', () => {
        if (!registered) {
            console.log('Unregistered socket left:', socket.id)
        }
        console.log('Socket disconnected:', socket.id)
    })
})

// Start server
server.listen(port, () => {
    console.log('Socket + API running on http://localhost:' + port)
})
