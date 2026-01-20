import { socket } from "../socket"

export function sendOffer(to: number, offer: RTCSessionDescriptionInit) {
  socket.emit("call:offer", { to, offer })
}

export function sendAnswer(to: number, answer: RTCSessionDescriptionInit) {
  socket.emit("call:answer", { to, answer })
}

export function sendIce(to: number, candidate: RTCIceCandidate) {
  socket.emit("call:ice", { to, candidate })
}

