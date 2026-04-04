import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "./config";

const SOCKET_URL = getApiBaseUrl();

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});
