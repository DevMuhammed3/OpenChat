import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './modules/AuthRoutes.js'
import { authMiddleware } from './middleware/auth.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*' }
})

app.use(cors())
app.use(express.json())


app.use('/api/auth', authRoutes)

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authorized!', userId: (req as any).userId })
})


app.get('/', (req, res) => {
  res.json({ message: 'OpenChat Backend Working!' })
})


io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('send-message', (message: string) => {
    console.log('Received message from', socket.id, message)
    io.emit('receive-message', message)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})


const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})