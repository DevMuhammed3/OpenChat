import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
// Respect environment variable or NEXT_SOCKET_PORT, default to 4000 to match main backend
const port =  process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*" 
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("send-message", (message) => {
    console.log("Received:", message);
    socket.broadcast.emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

