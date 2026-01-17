let messageAudio: HTMLAudioElement | null = null

export function playMessageSound() {
  if (!messageAudio) {
    messageAudio = new Audio("/sounds/message.mp3")
  }

  messageAudio.currentTime = 0
  messageAudio.play().catch(() => {})
}

