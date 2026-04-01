import { queryOptions, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { ChannelMessage } from "@/features/chat/types"

type MessagesResponse = {
  messages: ChannelMessage[]
}

export const messageKeys = {
  all: ["messages"] as const,
  list: (chatPublicId: string, channelPublicId: string) =>
    ["chats", chatPublicId, "channels", channelPublicId, "messages"] as const,
}

function getMessageTimestamp(message: ChannelMessage) {
  if (message.createdAt) {
    const parsed = new Date(message.createdAt).getTime()
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return message.id
}

export function sortMessages(messages: ChannelMessage[]) {
  return [...messages].sort((left, right) => {
    const timestampDelta = getMessageTimestamp(left) - getMessageTimestamp(right)
    return timestampDelta !== 0 ? timestampDelta : left.id - right.id
  })
}

export function mergeMessage(messages: ChannelMessage[], message: ChannelMessage) {
  const withoutExisting = messages.filter((item) => item.id !== message.id)
  withoutExisting.push(message)
  return sortMessages(withoutExisting)
}

export function getMessagesQueryOptions(chatPublicId: string, channelPublicId: string) {
  return queryOptions({
    queryKey: messageKeys.list(chatPublicId, channelPublicId),
    staleTime: 20_000,
    gcTime: 20 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<MessagesResponse>(`/chats/${chatPublicId}/messages`, {
        query: { channelPublicId },
      })

      return sortMessages(data.messages ?? [])
    },
  })
}

export function useMessages(chatPublicId?: string, channelPublicId?: string) {
  return useQuery<ChannelMessage[]>({
    queryKey:
      chatPublicId && channelPublicId
        ? messageKeys.list(chatPublicId, channelPublicId)
        : [...messageKeys.all, "idle"],
    queryFn: async () => {
      if (!chatPublicId || !channelPublicId) {
        return []
      }

      const data = await apiClient.get<MessagesResponse>(`/chats/${chatPublicId}/messages`, {
        query: { channelPublicId },
      })

      return sortMessages(data.messages ?? [])
    },
    staleTime: 20_000,
    gcTime: 20 * 60_000,
    enabled: Boolean(chatPublicId && channelPublicId),
  })
}
