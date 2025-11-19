// // apps/backend/src/index.ts
// import express from 'express'
// import http from 'http'
// import { Server } from 'socket.io'
// import cors from 'cors'
// import dotenv from 'dotenv'

// dotenv.config()

// const app = express()
// const server = http.createServer(app)
// const io = new Server(server, {
//   cors: { origin: '*' }
// })

// app.use(cors())
// app.use(express.json())

// app.get('/', (req, res) => {
//   res.json({ message: 'OpenChat Backend Working!' })
// })

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id)
//   // handle chat messages
//   socket.on('send-message', (message: string) => {
//     console.log('Received message from', socket.id, message)
//     // broadcast to all connected clients
//     io.emit('receive-message', message)
//   })
// })

// server.listen(3001, () => {
//   console.log('Server running on http://localhost:3001')
// })

import { app } from "./app.js";

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});