'use client'

import { useEffect, useRef } from 'react'
import { useCallStore } from '@/app/stores/call-store'
import { useChannelVoiceCall } from '@/hooks/useChannelVoiceCall'

export default function ChannelCallManager() {
  const channelPublicId = useCallStore(s => s.channelPublicId)
  const isMuted = useCallStore(s => s.isMuted)
  const isSpeaker = useCallStore(s => s.isSpeaker)
  const { remoteStreams, joinCall, leaveCall, setMuted } = useChannelVoiceCall()
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())

  useEffect(() => {
    if (channelPublicId) {
      joinCall(channelPublicId)
    } else {
      leaveCall()
    }
  }, [channelPublicId, joinCall, leaveCall])

  useEffect(() => {
    setMuted(isMuted)
  }, [isMuted, setMuted])

  useEffect(() => {
    // Update audio elements for remote streams
    remoteStreams.forEach((stream, userId) => {
      let audio = audioRefs.current.get(userId)
      if (!audio) {
        audio = new Audio()
        audio.autoplay = true
        audioRefs.current.set(userId, audio)
      }
      audio.muted = !isSpeaker
      if (audio.srcObject !== stream) {
        audio.srcObject = stream
      }
    })

    // Cleanup old streams
    Array.from(audioRefs.current.keys()).forEach(userId => {
      if (!remoteStreams.has(userId)) {
        const audio = audioRefs.current.get(userId)
        if (audio) {
          audio.srcObject = null
          audio.remove()
        }
        audioRefs.current.delete(userId)
      }
    })
  }, [isSpeaker, remoteStreams])

  useEffect(() => {
    const currentAudioRefs = audioRefs.current

    return () => {
      currentAudioRefs.forEach((audio) => {
        audio.pause()
        audio.srcObject = null
        audio.remove()
      })
      currentAudioRefs.clear()
    }
  }, [])

  return null
}
