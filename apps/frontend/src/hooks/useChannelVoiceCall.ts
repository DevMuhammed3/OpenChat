import { useCallback, useEffect, useRef, useState } from "react"
import { socket, getAudioStream, createPeer } from "@openchat/lib"

interface Participant {
  userId: number
  socketId: string
  username: string
  avatar: string | null
}

export function useChannelVoiceCall(channelPublicId: string | null) {
  const [inCall, setInCall] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())

  async function fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/webrtc/ice`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch ICE servers")
      const data = await res.json()
      return data.iceServers
    } catch (err) {
      console.error("ICE Fetch Error:", err)
      return [{ urls: "stun:stun.l.google.com:19302" }]
    }
  }

  const cleanup = useCallback(() => {
    console.log("[ChannelCall] Cleaning up...")
    peerConnections.current.forEach(pc => pc.close())
    peerConnections.current.clear()
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    setRemoteStreams(new Map())
    setParticipants([])
    setInCall(false)
  }, [])

  const createPeerConnection = async (targetSocketId: string, targetUserId: number, iceServers: RTCIceServer[], isInitiator: boolean) => {
    if (peerConnections.current.has(targetSocketId)) return peerConnections.current.get(targetSocketId)!

    const pc = createPeer(iceServers)
    peerConnections.current.set(targetSocketId, pc)

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) pc.addTrack(track, localStreamRef.current)
      })
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const next = new Map(prev)
        next.set(targetUserId, event.streams[0])
        return next
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("channel:signal", {
          toSocketId: targetSocketId,
          signal: { type: "ice", candidate: event.candidate }
        })
      }
    }

    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit("channel:signal", {
        toSocketId: targetSocketId,
        signal: { type: "offer", offer }
      })
    }

    return pc
  }

  const joinCall = useCallback(async () => {
    if (!channelPublicId) return
    console.log("[ChannelCall] Joining channel:", channelPublicId)

    try {
      const stream = await getAudioStream()
      localStreamRef.current = stream
      setInCall(true)

      socket.emit("channel:join-call", { channelPublicId })
    } catch (err) {
      console.error("[ChannelCall] Join Error:", err)
    }
  }, [channelPublicId])

  const leaveCall = useCallback(() => {
    if (!channelPublicId) return
    socket.emit("channel:leave-call", { channelPublicId })
    cleanup()
  }, [channelPublicId, cleanup])

  useEffect(() => {
    if (!channelPublicId) return

    const handleUserJoined = async ({ participant }: { participant: Participant }) => {
      console.log("[ChannelCall] User joined:", participant.username)
      setParticipants(prev => [...prev, participant])
      
      const iceServers = await fetchIceServers()
      await createPeerConnection(participant.socketId, participant.userId, iceServers, true)
    }

    const handleCurrentParticipants = async ({ participants }: { participants: Participant[] }) => {
      console.log("[ChannelCall] Current participants:", participants)
      setParticipants(participants)
      // Joiner is not the initiator for existing participants
    }

    const handleUserLeft = ({ userId }: { userId: number }) => {
      console.log("[ChannelCall] User left:", userId)
      setParticipants(prev => prev.filter(p => p.userId !== userId))
      setRemoteStreams(prev => {
        const next = new Map(prev)
        next.delete(userId)
        return next
      })
      // find and close peer connection
      // We don't have socketId here easily, but we can find it in our mapping or close all for that user
    }

    const handleSignal = async ({ fromSocketId, fromUserId, signal }: any) => {
      const iceServers = await fetchIceServers()
      let pc = peerConnections.current.get(fromSocketId)
      
      if (!pc) {
        pc = await createPeerConnection(fromSocketId, fromUserId, iceServers, false)
      }

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit("channel:signal", {
          toSocketId: fromSocketId,
          signal: { type: "answer", answer }
        })
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer))
      } else if (signal.type === "ice") {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
      }
    }

    socket.on("channel:user-joined", handleUserJoined)
    socket.on("channel:current-participants", handleCurrentParticipants)
    socket.on("channel:user-left", handleUserLeft)
    socket.on("channel:signal", handleSignal)

    return () => {
      socket.off("channel:user-joined", handleUserJoined)
      socket.off("channel:current-participants", handleCurrentParticipants)
      socket.off("channel:user-left", handleUserLeft)
      socket.off("channel:signal", handleSignal)
    }
  }, [channelPublicId])

  return {
    inCall,
    participants,
    remoteStreams,
    joinCall,
    leaveCall
  }
}
