import { useCallback, useEffect, useRef, useState } from "react"
import { socket, getAudioStream, createPeer } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"

export function useVoiceCall() {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const cleaningRef = useRef(false)
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([])
  
  const startingRef = useRef(false)
  const acceptingRef = useRef(false)
  const [inCall, setInCall] = useState(false)

  const setConnected = useCallStore((s) => s.setConnected)
  const clearCall = useCallStore((s) => s.clear)
  const getActiveChatId = () => useCallStore.getState().chatPublicId

  async function fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/webrtc/ice`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      return data.iceServers
    } catch (err) {
      console.error("[useVoiceCall] fetchIceServers Error:", err)
      return [{ urls: "stun:stun.l.google.com:19302" }]
    }
  }

  const toggleMute = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
  }, [])

  const cleanupCall = useCallback(() => {
    if (cleaningRef.current) return
    cleaningRef.current = true
    
    console.log("[useVoiceCall] cleanup...")
    const cid = getActiveChatId()
    if (cid) {
        socket.emit("leave-room", { chatPublicId: cid })
    }

    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
    pendingOfferRef.current = null
    iceQueueRef.current = []
    clearCall()
    setInCall(false)
    startingRef.current = false
    acceptingRef.current = false
    
    setTimeout(() => { cleaningRef.current = false }, 300)
  }, [clearCall])

  const finalizeConnection = (peer: RTCPeerConnection) => {
    peer.onconnectionstatechange = () => {
      console.log("[useVoiceCall] Connection state:", peer.connectionState)
      if (peer.connectionState === "connected") {
        setConnected()
      }
      if (peer.connectionState === "failed" || peer.connectionState === "closed") {
        // Don't instantly cleanup on "failed" if we support reconnect,
        // but for now, we'll keep it simple.
      }
    }
  }

  const startCall = useCallback(async (chatPublicId: string) => {
    if (startingRef.current) return
    startingRef.current = true
    
    console.log("[useVoiceCall] startCall...")
    try {
      socket.emit("join-room", { chatPublicId })

      if (!localStreamRef.current) {
        const stream = await getAudioStream()
        localStreamRef.current = stream
      }
      const stream = localStreamRef.current

      const iceServers = await fetchIceServers()
      
      if (peerRef.current) peerRef.current.close()
      
      const peer = createPeer(iceServers)
      peerRef.current = peer
      finalizeConnection(peer)

      stream.getTracks().forEach((t) => peer.addTrack(t, stream))

      peer.ontrack = (e) => {
        console.log("[useVoiceCall] received remote track")
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0]
        }
      }

      peer.onicecandidate = (e) => {
        if (!e.candidate) return
        socket.emit("call:ice", { chatPublicId, candidate: e.candidate })
      }

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      socket.emit("call:offer", { chatPublicId, offer })
      setInCall(true)
    } catch (err) {
      console.error("[useVoiceCall] startCall failed:", err)
      cleanupCall()
    } finally {
      startingRef.current = false
    }
  }, [setConnected, cleanupCall])

  const acceptCall = useCallback(async () => {
    const chatPublicId = getActiveChatId()
    if (!pendingOfferRef.current || !chatPublicId || acceptingRef.current) {
        return
    }
    
    acceptingRef.current = true
    console.log("[useVoiceCall] acceptCall starting...")
    try {
      socket.emit("join-room", { chatPublicId })

      if (!localStreamRef.current) {
        const stream = await getAudioStream()
        localStreamRef.current = stream
      }
      const stream = localStreamRef.current

      const iceServers = await fetchIceServers()
      
      if (peerRef.current) peerRef.current.close()
      
      const peer = createPeer(iceServers)
      peerRef.current = peer
      finalizeConnection(peer)

      stream.getTracks().forEach((t) => peer.addTrack(t, stream))

      peer.ontrack = (e) => {
        console.log("[useVoiceCall] received remote track")
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0]
        }
      }

      peer.onicecandidate = (e) => {
        if (!e.candidate) return
        socket.emit("call:ice", { chatPublicId, candidate: e.candidate })
      }

      await peer.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current))

      console.log("[useVoiceCall] Draining ICE candidates...")
      for (const cand of iceQueueRef.current) {
        await peer.addIceCandidate(cand).catch(() => {})
      }
      iceQueueRef.current = []

      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socket.emit("call:answer", { chatPublicId, answer })

      pendingOfferRef.current = null
      setInCall(true)
    } catch (err) {
      console.error("[useVoiceCall] acceptCall failed:", err)
      cleanupCall()
    } finally {
      acceptingRef.current = false
    }
  }, [setConnected, cleanupCall])

  useEffect(() => {
    const handleOffer = async ({ chatPublicId, offer }: any) => {
      console.log("[useVoiceCall] socket: call:offer, state:", peerRef.current?.signalingState)
      
      const peer = peerRef.current
      if (peer && peer.signalingState !== "stable") {
          console.warn("[useVoiceCall] Ignoring offer, signalingState is", peer.signalingState)
          return
      }

      pendingOfferRef.current = offer
      
      const state = useCallStore.getState()
      // If we are already "connected" (re-sync) or just "connecting"
      if ((state.status === "connecting" || state.status === "connected") && !state.isCaller) {
        await acceptCall()
      }
    }

    const handleAnswer = ({ chatPublicId, answer }: any) => {
      console.log("[useVoiceCall] socket: call:answer, state:", peerRef.current?.signalingState)
      const cid = getActiveChatId()
      const peer = peerRef.current
      
      if (!peer || chatPublicId !== cid) return
      
      if (peer.signalingState !== "have-local-offer") {
          console.warn("[useVoiceCall] Ignoring answer, state is not have-local-offer:", peer.signalingState)
          return
      }

      peer.setRemoteDescription(new RTCSessionDescription(answer)).then(() => {
        console.log("[useVoiceCall] Answer set. Draining ICE...")
        for (const cand of iceQueueRef.current) {
          peer.addIceCandidate(cand).catch(() => {})
        }
        iceQueueRef.current = []
      })
    }

    const handleIce = ({ chatPublicId, candidate }: any) => {
      const cid = getActiveChatId()
      if (chatPublicId !== cid) return
      
      const peer = peerRef.current
      if (!peer || !peer.remoteDescription) {
        iceQueueRef.current.push(candidate)
      } else {
        peer.addIceCandidate(candidate).catch(() => {})
      }
    }

    socket.on("call:offer", handleOffer)
    socket.on("call:answer", handleAnswer)
    socket.on("call:ice", handleIce)
    socket.on("call:end", cleanupCall)
    socket.on("call:reject", cleanupCall)
    socket.on("disconnect", cleanupCall)

    return () => {
      socket.off("call:offer", handleOffer)
      socket.off("call:answer", handleAnswer)
      socket.off("call:ice", handleIce)
      socket.off("call:end", cleanupCall)
      socket.off("call:reject", cleanupCall)
      socket.off("disconnect", cleanupCall)
    }
  }, [acceptCall, cleanupCall])

  return {
    startCall,
    acceptCall,
    endCall: () => {
        const cid = getActiveChatId()
        if (cid) socket.emit("call:end", { chatPublicId: cid })
        cleanupCall()
    },
    inCall,
    remoteAudioRef,
    toggleMute,
  }
}
