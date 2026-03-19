'use client'

import { useEffect, useRef } from 'react'
import { useCallStore } from '@/app/stores/call-store'
import { useChannelVoiceCall } from '@/hooks/useChannelVoiceCall'

export default function ChannelCallManager() {
  const channelPublicId = useCallStore(s => s.channelPublicId)
  const isMuted = useCallStore(s => s.isMuted)
  const { remoteStreams, joinCall, leaveCall, setMuted } = useChannelVoiceCall(channelPublicId)
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())

  useEffect(() => {
    if (channelPublicId) {
      joinCall()
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
  }, [remoteStreams])

  return null
}
