export type MessageSender = {
  id: number
  username: string
  avatar?: string | null
}

export type ChannelMessage = {
  id: number
  text: string | null
  senderId: number
  sender?: MessageSender
  fileUrl?: string | null
  fileType?: string | null
  isDeleted?: boolean
  isPinned?: boolean
  pinnedAt?: string | null
  createdAt?: string
  channelPublicId?: string | null
  chatPublicId?: string
}

export type SendChannelMessageInput = {
  text?: string
  file?: File | null
  previewUrl?: string | null
}
