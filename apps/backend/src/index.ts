// import express from "express";
import http from 'http'
import { Server } from 'socket.io'
import { app } from './app.js'

// const app = express();
const port = process.env.PORT || 4000

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

app.get('/', (req, res) => {
    res.send('Backend OK + Socket running')
})

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('send-message', (msg) => {
        console.log('Received:', msg)
        socket.broadcast.emit("receive-message", msg);
    })

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id)
    })
})

server.listen(port, () => {
    console.log(`Socket + API running on http://localhost:${port}`)
})
