import { io, type Socket } from "socket.io-client";

// Use environment variable if provided (Next/React conventions), fallback to localhost:4000
const SOCKET_URL =
	(typeof process !== 'undefined' && (process.env.NEXT_SOCKET_URL || process.env.REACT_APP_SOCKET_URL)) ||
	"http://localhost:4000";

export const socket: Socket = io(SOCKET_URL,{
  autoConnect: false,
  transports:["websocket"]
});

