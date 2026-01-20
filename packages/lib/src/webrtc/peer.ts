// packages/lib/src/webrtc/peer.ts

export function createPeer() {
  return new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  })
}

