import { type InfiniteData, queryOptions, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { ChannelMessage } from "@/features/chat/types"

export type ChatMessagePage = { messages: ChannelMessage[] }

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

export function useChannelPinnedMessages(chatPublicId?: string, channelPublicId?: string) {
  return useQuery<ChannelMessage[]>({
    queryKey:
      chatPublicId && channelPublicId
        ? [...messageKeys.list(chatPublicId, channelPublicId), "pinned"]
        : [...messageKeys.all, "idle"],
    queryFn: async () => {
      if (!chatPublicId || !channelPublicId) {
        return []
      }

      const data = await apiClient.get<MessagesResponse>(`/chats/${chatPublicId}/messages`, {
        query: { channelPublicId, pinned: true },
      })

      return data.messages?.filter(m => m.isPinned && !m.isDeleted) ?? []
    },
    staleTime: 20_000,
    gcTime: 20 * 60_000,
    enabled: Boolean(chatPublicId && channelPublicId),
  })
}

export function mergeIntoFirstPage(
  current: InfiniteData<ChatMessagePage> | undefined,
  message: ChannelMessage,
): InfiniteData<ChatMessagePage> {
  const firstPage = current?.pages[0] ?? { messages: [] }
  const withoutDup = firstPage.messages.filter((m) => m.id !== message.id)
  withoutDup.push(message)

  const sortedFirstPage = { messages: sortMessages(withoutDup) }
  const restPages = current?.pages.slice(1) ?? []

  return {
    pages: [sortedFirstPage, ...restPages],
    pageParams: current?.pageParams ?? [],
  }
}

export function updateInAllPages(
  current: InfiniteData<ChatMessagePage> | undefined,
  messageId: number,
  updater: (msg: ChannelMessage) => ChannelMessage,
): InfiniteData<ChatMessagePage> {
  if (!current) {
    return { pages: [], pageParams: [] }
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      messages: page.messages.map((msg) =>
        msg.id === messageId ? updater(msg) : msg,
      ),
    })),
  }
}
