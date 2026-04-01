'use client'

import { socket } from '@openchat/lib'
import { useCallStore, type CallUser } from '@/app/stores/call-store'
import { playMuteFeedback, playSessionJoinFeedback, playSessionLeaveFeedback, playSpeakerFeedback } from './audio-feedback'

type CallController = {
  startCall: (chatPublicId: string) => Promise<void>
  acceptCall: () => Promise<void>
  endCall: (options?: { notifyServer?: boolean; clearState?: boolean }) => Promise<void> | void
  toggleMute: (muted: boolean) => Promise<void> | void
}

type VoiceController = {
  joinCall: (channelPublicId: string) => Promise<void>
  leaveCall: () => Promise<void> | void
  setMuted: (muted: boolean) => Promise<void> | void
}

let callController: CallController | null = null
let voiceController: VoiceController | null = null

export function registerCallController(controller: CallController) {
  callController = controller

  return () => {
    if (callController === controller) {
      callController = null
    }
  }
}

export function registerVoiceController(controller: VoiceController) {
  voiceController = controller

  return () => {
    if (voiceController === controller) {
      voiceController = null
    }
  }
}

export async function endActiveSession() {
  const state = useCallStore.getState()

  if (state.session?.type === 'call' || state.status !== 'idle') {
    await callController?.endCall({ notifyServer: Boolean(state.chatPublicId), clearState: true })
  }

  if (state.session?.type === 'voice' || state.channelPublicId) {
    await voiceController?.leaveCall()
    useCallStore.getState().clearVoiceSession()
  }
}

export async function startVoiceSession(channelPublicId: string) {
  const current = useCallStore.getState()
  if (current.session?.type === 'voice' && current.session.id === channelPublicId) return

  await endActiveSession()
  useCallStore.getState().setChannelCall(channelPublicId)
  playSessionJoinFeedback()
}

export async function endVoiceSession() {
  const state = useCallStore.getState()
  if (state.session?.type !== 'voice' && !state.channelPublicId) return

  playSessionLeaveFeedback()
  await voiceController?.leaveCall()
  useCallStore.getState().clearVoiceSession()
}

export async function startOutgoingCallSession(args: {
  chatPublicId: string
  toUserId: number
  user: CallUser
}) {
  await endActiveSession()

  socket.emit('join-room', { chatPublicId: args.chatPublicId })
  socket.emit('call:user', {
    toUserId: args.toUserId,
    chatPublicId: args.chatPublicId,
  })

  useCallStore.getState().setCalling(args.chatPublicId, args.user)
  playSessionJoinFeedback()
}

export async function endCallSession(options?: { notifyServer?: boolean }) {
  const state = useCallStore.getState()
  if (state.status === 'idle' && state.session?.type !== 'call') return

  playSessionLeaveFeedback()
  await callController?.endCall({
    notifyServer: options?.notifyServer ?? Boolean(state.chatPublicId),
    clearState: true,
  })
}

export async function applyGlobalMuteToggle() {
  const state = useCallStore.getState()
  const nextMuted = !state.isMuted

  state.setMuted(nextMuted)
  playMuteFeedback(nextMuted)

  if (state.session?.type === 'call') {
    await callController?.toggleMute(nextMuted)
    return
  }

  if (state.session?.type === 'voice') {
    socket.emit('channel:participant-state', {
      channelPublicId: state.channelPublicId,
      isMuted: nextMuted,
      isSpeaker: state.isSpeaker,
    })
    await voiceController?.setMuted(nextMuted)
  }
}

export function toggleSpeakerOutput() {
  const state = useCallStore.getState()
  const nextSpeaker = !state.isSpeaker
  state.setSpeaker(nextSpeaker)
  playSpeakerFeedback(nextSpeaker)

  if (state.session?.type === 'voice' && state.channelPublicId) {
    socket.emit('channel:participant-state', {
      channelPublicId: state.channelPublicId,
      isMuted: state.isMuted,
      isSpeaker: nextSpeaker,
    })
  }
}
