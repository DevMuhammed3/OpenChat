import { useCallback, useEffect, useRef, useState } from "react"
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client"
import { api } from "@openchat/lib"

export function useChannelVoiceCall(channelPublicId: string | null) {
  const [inCall, setInCall] = useState(false)
  const [participants, setParticipants] = useState<Array<{ userId: number }>>([])
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())
  const roomRef = useRef<Room | null>(null)
  const activeChannelRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    const room = roomRef.current
    roomRef.current = null
    activeChannelRef.current = null
    setInCall(false)
    setParticipants([])
    setRemoteStreams(new Map())

    if (room) {
      room.disconnect()
    }
  }, [])

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

          setParticipants((prev) =>
            prev.some((entry) => entry.userId === userId) ? prev : [...prev, { userId }],
          )

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
          setParticipants((prev) => prev.filter((entry) => entry.userId !== userId))
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          const userId = Number(participant.identity)
          if (Number.isNaN(userId)) return

          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(userId)
            return next
          })
          setParticipants((prev) => prev.filter((entry) => entry.userId !== userId))
        })
        .on(RoomEvent.Disconnected, () => {
          roomRef.current = null
          activeChannelRef.current = null
          setInCall(false)
          setParticipants([])
          setRemoteStreams(new Map())
        })

      await room.connect(serverUrl, token)
      await room.localParticipant.setMicrophoneEnabled(true)

      roomRef.current = room
      activeChannelRef.current = channelPublicId
      setInCall(true)

      const initialParticipants = Array.from(room.remoteParticipants.values())
        .map((participant) => Number(participant.identity))
        .filter((userId) => !Number.isNaN(userId))
        .map((userId) => ({ userId }))
      setParticipants(initialParticipants)
    } catch (err) {
      console.error("[useChannelVoiceCall] joinCall failed:", err)
      cleanup()
    }
  }, [channelPublicId, cleanup])

  const leaveCall = useCallback(() => {
    cleanup()
  }, [cleanup])

  useEffect(() => cleanup, [cleanup])

  return {
    inCall,
    participants,
    remoteStreams,
    joinCall,
    leaveCall,
  }
}
