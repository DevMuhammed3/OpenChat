export type ChannelType = "TEXT" | "VOICE"

export type ZoneChannel = {
  publicId: string
  name: string
  type: ChannelType
}

export type ChannelVoiceParticipant = {
  userId: number
  socketId: string
  username: string
  avatar?: string | null
  isMuted: boolean
  isSpeaker: boolean
}

export type ZoneVoicePresence = {
  channelPublicId: string
  participants: ChannelVoiceParticipant[]
}
