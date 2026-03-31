'use client'

const audioCache = new Map<string, HTMLAudioElement>()

function playSound(path: string) {
  if (typeof window === 'undefined') return

  let audio = audioCache.get(path)
  if (!audio) {
    audio = new Audio(path)
    audioCache.set(path, audio)
  }

  audio.currentTime = 0
  audio.play().catch(() => {})
}

export function playMuteFeedback(nextMuted: boolean) {
  playSound(nextMuted ? '/sounds/mute.mp3' : '/sounds/ummute.mp3')
}

export function playSpeakerFeedback(nextSpeakerEnabled: boolean) {
  playSound(nextSpeakerEnabled ? '/sounds/undeafen.mp3' : '/sounds/deafen.mp3')
}

export function playSessionJoinFeedback() {
  playSound('/sounds/undeafen.mp3')
}

export function playSessionLeaveFeedback() {
  playSound('/sounds/deafen.mp3')
}

export function createPreloadedAudio(path: string, volume = 0.4) {
  if (typeof window === 'undefined') return null

  const audio = new Audio(path)
  audio.preload = 'auto'
  audio.volume = volume
  return audio
}
