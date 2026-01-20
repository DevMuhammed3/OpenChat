// packages/lib/src/webrtc/media.ts

export async function getAudioStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
  })
}
