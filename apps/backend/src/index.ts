import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { privateChatHandler } from "./socket/privateChat.js";

const port = process.env.PORT || 4000;

// Allowed origins for Socket.io
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "https://openchat.qzz.io",
  process.env.NEXT_PUBLIC_API_URL,
].filter(Boolean) as string[];

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Register each user to their private notification room
  socket.on("register", (userId) => {
    if (!userId) return;
    socket.join(userId.toString());
    console.log(`User ${userId} joined their personal room`);
    socket.emit("registered");
  });

  // Chat logic
  privateChatHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
server.listen(port, () => {
  console.log("Socket + API running on http://localhost:" + port);
});
