import { useEffect, useRef } from "react"
import {
  getAudioStream,
  createPeer,
  sendOffer,
  sendAnswer,
  sendIce,
} from "@openchat/lib"
import { socket } from "@openchat/lib"

export function useVoiceCall() {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentPeerUserRef = useRef<number | null>(null)

  /*  START CALL  */
  async function startCall(toUserId: number) {
    currentPeerUserRef.current = toUserId

    // 1️⃣ local audio
    const stream = await getAudioStream()
    localStreamRef.current = stream

    // 2️⃣ peer
    const peer = createPeer()
    peerRef.current = peer

    // 3️⃣ add audio tracks
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream)
    })

    // 4️⃣ receive remote audio
    peer.ontrack = (event) => {
      if (!remoteAudioRef.current) return
      remoteAudioRef.current.srcObject = event.streams[0]
    }

    // 5️⃣ ICE
    peer.onicecandidate = (event) => {
      if (event.candidate && currentPeerUserRef.current) {
        sendIce(currentPeerUserRef.current, event.candidate)
      }
    }

    // 6️⃣ offer
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    sendOffer(toUserId, offer)
  }

  /*  SOCKET LISTENERS  */
  useEffect(() => {
    // receive offer
    socket.on("call:offer", async ({ from, offer }) => {
      currentPeerUserRef.current = from

      const stream = await getAudioStream()
      localStreamRef.current = stream

      const peer = createPeer()
      peerRef.current = peer

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream)
      })

      peer.ontrack = (event) => {
        if (!remoteAudioRef.current) return
        remoteAudioRef.current.srcObject = event.streams[0]
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          sendIce(from, event.candidate)
        }
      }

      await peer.setRemoteDescription(offer)

      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      sendAnswer(from, answer)
    })

    // receive answer
    socket.on("call:answer", async ({ answer }) => {
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(answer)
    })

    // receive ice
    socket.on("call:ice", async ({ candidate }) => {
      if (!peerRef.current) return
      await peerRef.current.addIceCandidate(candidate)
    })

    return () => {
      socket.off("call:offer")
      socket.off("call:answer")
      socket.off("call:ice")
    }
  }, [])

  /*  END CALL  */
  function endCall() {
    peerRef.current?.close()
    peerRef.current = null

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }

    currentPeerUserRef.current = null
  }

  return {
    startCall,
    endCall,
    remoteAudioRef,
  }
}

