// packages/lib/src/webrtc/peer.ts

export function createPeer(iceServers: RTCIceServer[]) {
  return new RTCPeerConnection({ iceServers })
}
