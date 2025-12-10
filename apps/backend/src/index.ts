import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
// import { prisma } from "./config/prisma.js";
import { privateChatHandler } from "./socket/privateChat.js";

const port = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  privateChatHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log("Socket + API running on http://localhost:" + port);
});

