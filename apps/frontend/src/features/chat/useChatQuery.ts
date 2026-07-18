import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { ChannelMessage } from "@/features/chat/types"
import { messageKeys, sortMessages } from "./queries"

export type ChatMessagePage = { messages: ChannelMessage[] }

const PAGE_SIZE = 50

export function useChatQuery(chatPublicId: string, channelPublicId: string) {
  const result = useInfiniteQuery({
    queryKey: messageKeys.list(chatPublicId, channelPublicId),
    staleTime: 300_000,
    gcTime: 900_000,
    enabled: Boolean(chatPublicId),
    initialPageParam: undefined as number | undefined,
    queryFn: async (ctx): Promise<ChatMessagePage> => {
      const params: Record<string, string | number> = {}

      if (channelPublicId) {
        params.channelPublicId = channelPublicId
      }

      if (ctx.pageParam !== undefined) {
        params.cursor = ctx.pageParam as number
      }

      const data = await apiClient.get<{ messages: ChannelMessage[] }>(
        `/chats/${chatPublicId}/messages`,
        { query: params },
      )

      return { messages: sortMessages(data.messages ?? []) }
    },
    getNextPageParam: (lastPage: ChatMessagePage): number | undefined => {
      const msgs = lastPage?.messages
      if (!msgs || msgs.length < PAGE_SIZE) return undefined
      return msgs[msgs.length - 1]?.id
    },
  })

  const data: ChannelMessage[] = (() => {
    if (!result.data?.pages) return []
    const all: ChannelMessage[] = []
    for (const page of result.data.pages) {
      if (page?.messages) {
        all.push(...page.messages)
      }
    }
    return sortMessages(all)
  })()

  return {
    ...result,
    data,
  }
}

export function getInfiniteMessagesQueryOptions(chatPublicId: string, channelPublicId: string) {
  return {
    queryKey: messageKeys.list(chatPublicId, channelPublicId),
    staleTime: 300_000,
    gcTime: 900_000,
    initialPageParam: undefined as number | undefined,
    queryFn: async (ctx: { pageParam: unknown }): Promise<ChatMessagePage> => {
      const params: Record<string, string | number> = {}

      if (channelPublicId) {
        params.channelPublicId = channelPublicId
      }

      if (ctx.pageParam !== undefined) {
        params.cursor = ctx.pageParam as number
      }

      const data = await apiClient.get<{ messages: ChannelMessage[] }>(
        `/chats/${chatPublicId}/messages`,
        { query: params },
      )

      return { messages: sortMessages(data.messages ?? []) }
    },
    getNextPageParam: (lastPage: ChatMessagePage): number | undefined => {
      const msgs = lastPage?.messages
      if (!msgs || msgs.length < PAGE_SIZE) return undefined
      return msgs[msgs.length - 1]?.id
    },
  }
}
