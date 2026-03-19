import { useCallback, useEffect, useRef, useState } from "react"
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client"
import { api, socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"

export function useChannelVoiceCall(channelPublicId: string | null) {
  const [inCall, setInCall] = useState(false)
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())
  const roomRef = useRef<Room | null>(null)
  const activeChannelRef = useRef<string | null>(null)
  const setChannelParticipants = useCallStore((s) => s.setChannelParticipants)
  const upsertChannelParticipant = useCallStore((s) => s.upsertChannelParticipant)
  const removeChannelParticipant = useCallStore((s) => s.removeChannelParticipant)

  const cleanup = useCallback(() => {
    const room = roomRef.current
    const activeChannelId = activeChannelRef.current
    roomRef.current = null
    activeChannelRef.current = null
    setInCall(false)
    setRemoteStreams(new Map())
    setChannelParticipants([])

    if (activeChannelId) {
      socket.emit("channel:leave-call", { channelPublicId: activeChannelId })
    }

    if (room) {
      room.disconnect()
    }
  }, [setChannelParticipants])

  const joinCall = useCallback(async () => {
    if (!channelPublicId) return
    if (activeChannelRef.current === channelPublicId && roomRef.current) return

    cleanup()

    try {
      const res = await api(`/webrtc/token?roomType=channel&roomId=${channelPublicId}`, {
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || `Failed to fetch token: ${res.status}`)
      }

      const { token, serverUrl } = await res.json()
      const room = new Room()

      room
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio) return

          const userId = Number(participant.identity)
          if (Number.isNaN(userId)) return

          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.set(userId, new MediaStream([track.mediaStreamTrack]))
            return next
          })
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio) return

          const userId = Number(participant.identity)
          if (Number.isNaN(userId)) return

          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(userId)
            return next
          })
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          const userId = Number(participant.identity)
          if (Number.isNaN(userId)) return

          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(userId)
            return next
          })
        })
        .on(RoomEvent.Disconnected, () => {
          roomRef.current = null
          activeChannelRef.current = null
          setInCall(false)
          setRemoteStreams(new Map())
          setChannelParticipants([])
        })

      await room.connect(serverUrl, token)
      await room.localParticipant.setMicrophoneEnabled(true)
      socket.emit("channel:join-call", { channelPublicId })

      roomRef.current = room
      activeChannelRef.current = channelPublicId
      setInCall(true)
    } catch (err) {
      console.error("[useChannelVoiceCall] joinCall failed:", err)
      cleanup()
    }
  }, [channelPublicId, cleanup, setChannelParticipants])

  const leaveCall = useCallback(() => {
    cleanup()
  }, [cleanup])

  const setMuted = useCallback(async (muted: boolean) => {
    const room = roomRef.current
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!muted)
    } catch (err) {
      console.error("[useChannelVoiceCall] setMuted failed:", err)
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  useEffect(() => {
    if (!channelPublicId) return

    const handleReconnect = () => {
      void joinCall()
    }

    socket.on("connect", handleReconnect)

    return () => {
      socket.off("connect", handleReconnect)
    }
  }, [channelPublicId, joinCall])

  useEffect(() => {
    if (!channelPublicId) {
      setChannelParticipants([])
      return
    }

    const handleCurrentParticipants = (payload: {
      channelPublicId: string
      participants: Array<{
        userId: number
        socketId: string
        username: string
        avatar: string | null
      }>
    }) => {
      if (payload.channelPublicId !== channelPublicId) return
      setChannelParticipants(payload.participants)
    }

    const handleUserJoined = (payload: {
      channelPublicId: string
      participant: {
        userId: number
        socketId: string
        username: string
        avatar: string | null
      }
    }) => {
      if (payload.channelPublicId !== channelPublicId) return
      upsertChannelParticipant(payload.participant)
    }

    const handleUserLeft = (payload: { channelPublicId: string; userId: number }) => {
      if (payload.channelPublicId !== channelPublicId) return
      removeChannelParticipant(payload.userId)
    }

    socket.on("channel:current-participants", handleCurrentParticipants)
    socket.on("channel:user-joined", handleUserJoined)
    socket.on("channel:user-left", handleUserLeft)

    return () => {
      socket.off("channel:current-participants", handleCurrentParticipants)
      socket.off("channel:user-joined", handleUserJoined)
      socket.off("channel:user-left", handleUserLeft)
    }
  }, [channelPublicId, removeChannelParticipant, setChannelParticipants, upsertChannelParticipant])

  return {
    inCall,
    remoteStreams,
    joinCall,
    leaveCall,
    setMuted,
  }
}
