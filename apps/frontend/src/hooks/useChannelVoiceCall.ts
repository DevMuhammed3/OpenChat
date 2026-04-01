import { useCallback, useEffect, useRef, useState } from "react"
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client"
import { api, socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import { registerVoiceController } from "@/app/lib/session-runtime"
import { useUserStore } from "@/app/stores/user-store"
import { createPreloadedAudio } from "@/app/lib/audio-feedback"

export function useChannelVoiceCall() {
  const [inCall, setInCall] = useState(false)
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())
  const roomRef = useRef<Room | null>(null)
  const activeChannelRef = useRef<string | null>(null)
  const isJoiningRef = useRef(false)
  const delayedCleanupRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzersRef = useRef<Map<number, { frameId: number; context: AudioContext; source: MediaStreamAudioSourceNode }>>(new Map())
  const joinAudioRef = useRef<HTMLAudioElement | null>(null)
  const leaveAudioRef = useRef<HTMLAudioElement | null>(null)
  const channelPublicId = useCallStore((s) => s.channelPublicId)
  const currentUserId = useUserStore((s) => s.user?.id ?? null)
  const isSpeaker = useCallStore((s) => s.isSpeaker)
  const setChannelParticipants = useCallStore((s) => s.setChannelParticipants)
  const upsertChannelParticipant = useCallStore((s) => s.upsertChannelParticipant)
  const removeChannelParticipant = useCallStore((s) => s.removeChannelParticipant)
  const clearVoiceSession = useCallStore((s) => s.clearVoiceSession)

  useEffect(() => {
    if (!joinAudioRef.current) {
      joinAudioRef.current = createPreloadedAudio("/sounds/connect.mp3", 0.4)
    }
    if (!leaveAudioRef.current) {
      leaveAudioRef.current = createPreloadedAudio("/sounds/disconnect.mp3", 0.4)
    }
  }, [])

  const playJoinSound = useCallback(() => {
    if (!isSpeaker || !joinAudioRef.current) return
    joinAudioRef.current.currentTime = 0
    joinAudioRef.current.play().catch(() => {})
  }, [isSpeaker])

  const playLeaveSound = useCallback(() => {
    if (!isSpeaker || !leaveAudioRef.current) return
    leaveAudioRef.current.currentTime = 0
    leaveAudioRef.current.play().catch(() => {})
  }, [isSpeaker])

  const stopAnalyzing = useCallback((userId?: number) => {
    if (typeof userId === "number") {
      const analyzer = analyzersRef.current.get(userId)
      if (analyzer) {
        window.cancelAnimationFrame(analyzer.frameId)
        analyzer.source.disconnect()
        analyzersRef.current.delete(userId)
      }
      useCallStore.getState().setSpeaking(userId, false)
      return
    }

    analyzersRef.current.forEach((analyzer, analyzerUserId) => {
      window.cancelAnimationFrame(analyzer.frameId)
      analyzer.source.disconnect()
      useCallStore.getState().setSpeaking(analyzerUserId, false)
    })
    analyzersRef.current.clear()
  }, [])

  const startAnalyzing = useCallback((userId: number, stream: MediaStream) => {
    if (typeof window === "undefined") return

    stopAnalyzing(userId)

    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    const context = audioContextRef.current ?? new AudioContextCtor()
    audioContextRef.current = context

    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)

    const data = new Uint8Array(analyser.fftSize)
    let speaking = false

    const tick = () => {
      analyser.getByteTimeDomainData(data)

      let sum = 0
      for (let index = 0; index < data.length; index += 1) {
        const normalized = (data[index] - 128) / 128
        sum += normalized * normalized
      }

      const rms = Math.sqrt(sum / data.length)
      const nextSpeaking = rms > 0.035 && (!currentUserId || userId !== currentUserId || !useCallStore.getState().isMuted)

      if (nextSpeaking !== speaking) {
        speaking = nextSpeaking
        useCallStore.getState().setSpeaking(userId, nextSpeaking)
      }

      const frameId = window.requestAnimationFrame(tick)
      analyzersRef.current.set(userId, { frameId, context, source })
    }

    const frameId = window.requestAnimationFrame(tick)
    analyzersRef.current.set(userId, { frameId, context, source })
  }, [currentUserId, stopAnalyzing])

  const cleanup = useCallback(() => {
    if (delayedCleanupRef.current) {
      window.clearTimeout(delayedCleanupRef.current)
      delayedCleanupRef.current = null
    }

    const room = roomRef.current
    const activeChannelId = activeChannelRef.current
    roomRef.current = null
    activeChannelRef.current = null
    setInCall(false)
    setRemoteStreams(new Map())
    setChannelParticipants([])
    stopAnalyzing()

    if (activeChannelId) {
      socket.emit("channel:leave-call", { channelPublicId: activeChannelId })
    }

    if (room) {
      room.localParticipant.trackPublications.forEach((publication) => {
        publication.track?.stop()
      })
      room.disconnect()
    }
  }, [setChannelParticipants, stopAnalyzing])

  const joinCall = useCallback(async (nextChannelPublicId: string) => {
    if (!nextChannelPublicId) return
    if (isJoiningRef.current) return

    if (delayedCleanupRef.current) {
      window.clearTimeout(delayedCleanupRef.current)
      delayedCleanupRef.current = null
    }

    if (activeChannelRef.current === nextChannelPublicId && roomRef.current) {
      setInCall(true)
      return
    }

    if (activeChannelRef.current && activeChannelRef.current !== nextChannelPublicId) {
      cleanup()
    }

    isJoiningRef.current = true

    try {
      const res = await api(`/webrtc/token?roomType=channel&roomId=${nextChannelPublicId}`, {
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

          const mediaStream = new MediaStream([track.mediaStreamTrack])
          startAnalyzing(userId, mediaStream)

          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.set(userId, mediaStream)
            return next
          })
        })
        .on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio) return

          const userId = Number(participant.identity)
          if (Number.isNaN(userId)) return

          stopAnalyzing(userId)

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
          
          useCallStore.getState().setSpeaking(userId, false)
          stopAnalyzing(userId)
        })
        .on(RoomEvent.Disconnected, () => {
          roomRef.current = null
          activeChannelRef.current = null
          setInCall(false)
          setRemoteStreams(new Map())
          setChannelParticipants([])
          stopAnalyzing()
        })

      await room.connect(serverUrl, token)
      
      // Respect current mute state on join
      const currentIsMuted = useCallStore.getState().isMuted
      await room.localParticipant.setMicrophoneEnabled(!currentIsMuted)
      const localTrack = Array.from(room.localParticipant.trackPublications.values())
        .map((publication) => publication.track)
        .find((track) => track?.kind === Track.Kind.Audio)

      if (currentUserId && localTrack?.mediaStreamTrack) {
        startAnalyzing(currentUserId, new MediaStream([localTrack.mediaStreamTrack]))
      }
      
      socket.emit("channel:join-call", {
        channelPublicId: nextChannelPublicId,
        isMuted: currentIsMuted,
        isSpeaker: useCallStore.getState().isSpeaker,
      })

      roomRef.current = room
      activeChannelRef.current = nextChannelPublicId
      setInCall(true)
    } catch (err) {
      console.error("[useChannelVoiceCall] joinCall failed:", err)
      cleanup()
      clearVoiceSession()
    } finally {
      isJoiningRef.current = false
    }
  }, [cleanup, clearVoiceSession, currentUserId, setChannelParticipants, startAnalyzing, stopAnalyzing])

  const leaveCall = useCallback(() => {
    if (delayedCleanupRef.current) {
      window.clearTimeout(delayedCleanupRef.current)
    }

    delayedCleanupRef.current = window.setTimeout(() => {
      delayedCleanupRef.current = null
      cleanup()
    }, 450)
    clearVoiceSession()
  }, [cleanup, clearVoiceSession])

  const setMuted = useCallback(async (muted: boolean) => {
    const room = roomRef.current
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!muted)
      socket.emit("channel:participant-state", {
        channelPublicId: activeChannelRef.current,
        isMuted: muted,
        isSpeaker: useCallStore.getState().isSpeaker,
      })
      if (currentUserId && muted) {
        useCallStore.getState().setSpeaking(currentUserId, false)
      }
    } catch (err) {
      console.error("[useChannelVoiceCall] setMuted failed:", err)
    }
  }, [currentUserId])

  useEffect(() => cleanup, [cleanup])

  useEffect(() => {
    if (!channelPublicId) return

    const handleReconnect = () => {
      void joinCall(channelPublicId)
    }

    const handleDisconnect = () => {
      leaveCall()
    }

    socket.on("connect", handleReconnect)
    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("connect", handleReconnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [channelPublicId, joinCall, leaveCall])

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
        isMuted?: boolean
        isSpeaker?: boolean
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
        isMuted?: boolean
        isSpeaker?: boolean
      }
    }) => {
      if (payload.channelPublicId !== channelPublicId) return
      upsertChannelParticipant(payload.participant)
    }

    const handleUserLeft = (payload: { channelPublicId: string; userId: number }) => {
      if (payload.channelPublicId !== channelPublicId) return
      removeChannelParticipant(payload.userId)
    }

    const handleUserUpdated = (payload: {
      channelPublicId: string
      participant: {
        userId: number
        socketId: string
        username: string
        avatar: string | null
        isMuted?: boolean
        isSpeaker?: boolean
      }
    }) => {
      if (payload.channelPublicId !== channelPublicId) return
      upsertChannelParticipant(payload.participant)
    }

    const handleVoiceRoomJoin = (user: { id: number; roomId: string }) => {
      if (user.id === currentUserId) return
      if (user.roomId !== channelPublicId) return
      playJoinSound()
    }

    const handleVoiceRoomLeave = (user: { id: number; roomId: string }) => {
      if (user.id === currentUserId) return
      if (user.roomId !== channelPublicId) return
      playLeaveSound()
    }

    socket.on("channel:current-participants", handleCurrentParticipants)
    socket.on("channel:user-joined", handleUserJoined)
    socket.on("channel:user-left", handleUserLeft)
    socket.on("channel:user-updated", handleUserUpdated)
    socket.on("user_joined_voice_room", handleVoiceRoomJoin)
    socket.on("user_left_voice_room", handleVoiceRoomLeave)

    return () => {
      socket.off("channel:current-participants", handleCurrentParticipants)
      socket.off("channel:user-joined", handleUserJoined)
      socket.off("channel:user-left", handleUserLeft)
      socket.off("channel:user-updated", handleUserUpdated)
      socket.off("user_joined_voice_room", handleVoiceRoomJoin)
      socket.off("user_left_voice_room", handleVoiceRoomLeave)
    }
  }, [channelPublicId, currentUserId, playJoinSound, playLeaveSound, removeChannelParticipant, setChannelParticipants, upsertChannelParticipant])

  useEffect(() => {
    return registerVoiceController({
      joinCall,
      leaveCall,
      setMuted,
    })
  }, [joinCall, leaveCall, setMuted])

  return {
    inCall,
    remoteStreams,
    joinCall,
    leaveCall,
    setMuted,
  }
}
