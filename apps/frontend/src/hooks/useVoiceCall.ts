import { useCallback, useEffect, useRef } from "react"
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client"
import { api, socket } from "@openchat/lib"
import { useCallStore } from "@/app/stores/call-store"
import { registerCallController } from "@/app/lib/session-runtime"

export function useVoiceCall() {
  const roomRef = useRef<Room | null>(null)
  const activeChatRef = useRef<string | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  const setConnected = useCallStore((s) => s.setConnected)
  const clearCall = useCallStore((s) => s.clear)
  const getActiveChatId = () => useCallStore.getState().chatPublicId

  const detachRemoteAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.srcObject = null
    }
  }, [])

  const disconnectRoom = useCallback(() => {
    const room = roomRef.current
    roomRef.current = null
    activeChatRef.current = null
    detachRemoteAudio()

    if (room) {
      room.localParticipant.trackPublications.forEach((publication) => {
        publication.track?.stop()
      })
      room.disconnect()
    }
  }, [detachRemoteAudio])

  const connectToChatRoom = useCallback(
    async (chatPublicId: string) => {
      if (activeChatRef.current === chatPublicId && roomRef.current) {
        return roomRef.current
      }

      disconnectRoom()

      const res = await api(`/webrtc/token?roomType=dm&roomId=${chatPublicId}`, {
        credentials: "include",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || `Failed to fetch token: ${res.status}`)
      }

      const { token, serverUrl } = await res.json()
      const room = new Room()

      room
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (track.kind !== Track.Kind.Audio || !remoteAudioRef.current) return
          track.attach(remoteAudioRef.current)
          void remoteAudioRef.current.play().catch(() => {})
        })
        .on(RoomEvent.TrackUnsubscribed, (track) => {
          if (track.kind !== Track.Kind.Audio) return
          if (remoteAudioRef.current) {
            track.detach(remoteAudioRef.current)
          }
          detachRemoteAudio()
        })
        .on(RoomEvent.Disconnected, () => {
          roomRef.current = null
          activeChatRef.current = null
          detachRemoteAudio()
        })

      await room.connect(serverUrl, token)
      await room.localParticipant.setMicrophoneEnabled(true)

      roomRef.current = room
      activeChatRef.current = chatPublicId
      setConnected()

      return room
    },
    [detachRemoteAudio, disconnectRoom, setConnected],
  )

  const startCall = useCallback(
    async (chatPublicId: string) => {
      try {
        await connectToChatRoom(chatPublicId)
      } catch (err) {
        console.error("[useVoiceCall] startCall failed:", err)
        disconnectRoom()
      }
    },
    [connectToChatRoom, disconnectRoom],
  )

  const acceptCall = useCallback(async () => {
    const chatPublicId = getActiveChatId()
    if (!chatPublicId) return

    try {
      await connectToChatRoom(chatPublicId)
    } catch (err) {
      console.error("[useVoiceCall] acceptCall failed:", err)
      disconnectRoom()
    }
  }, [connectToChatRoom, disconnectRoom])

  const endCall = useCallback((options?: { notifyServer?: boolean; clearState?: boolean }) => {
    const chatPublicId = getActiveChatId()
    if (options?.notifyServer !== false && chatPublicId) {
      socket.emit("call:end", { chatPublicId })
    }

    disconnectRoom()
    if (options?.clearState !== false) {
      clearCall()
    }
  }, [clearCall, disconnectRoom])

  const toggleMute = useCallback(async (muted: boolean) => {
    const room = roomRef.current
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!muted)
    } catch (err) {
      console.error("[useVoiceCall] toggleMute failed:", err)
    }
  }, [])

  useEffect(
    () => () => {
      disconnectRoom()
      clearCall()
    },
    [clearCall, disconnectRoom],
  )

  useEffect(() => {
    return registerCallController({
      startCall,
      acceptCall,
      endCall,
      toggleMute,
    })
  }, [acceptCall, endCall, startCall, toggleMute])

  return {
    startCall,
    acceptCall,
    endCall,
    remoteAudioRef,
    toggleMute,
  }
}
