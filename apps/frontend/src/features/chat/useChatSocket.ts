"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { socket } from "@openchat/lib"
import { messageKeys, mergeIntoFirstPage, updateInAllPages, type ChatMessagePage } from "./queries"
import type { ChannelMessage } from "./types"
import type { InfiniteData } from "@tanstack/react-query"

type PrivateMessagePayload = ChannelMessage & {
  chatPublicId: string
  channelPublicId?: string
  text?: string | null
  fileUrl?: string | null
  createdAt?: string
}

export function useChatSocket(chatPublicId: string, channelPublicId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!chatPublicId) return

    const queryKey = messageKeys.list(
      chatPublicId,
      channelPublicId || chatPublicId,
    )

    const handlePrivateMessage = (msg: PrivateMessagePayload) => {
      if (msg.chatPublicId !== chatPublicId) return
      if (channelPublicId && msg.channelPublicId !== channelPublicId) return
      if (!channelPublicId && msg.channelPublicId) return

      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        queryKey,
        (current) => mergeIntoFirstPage(current, msg),
      )
    }

    const handleUpdated = (payload: { id: number } & Partial<ChannelMessage>) => {
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        queryKey,
        (current) =>
          updateInAllPages(current, payload.id, (msg) => ({
            ...msg,
            ...payload,
          })),
      )
    }

    const handleDeleted = ({ id }: { id: number }) => {
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        queryKey,
        (current) =>
          updateInAllPages(current, id, (msg) => ({
            ...msg,
            isDeleted: true,
            text: null,
          })),
      )
    }

    const handlePinned = (payload: {
      id: number
      isPinned: boolean
      pinnedAt: string | null
    }) => {
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(
        queryKey,
        (current) =>
          updateInAllPages(current, payload.id, (msg) => ({
            ...msg,
            isPinned: payload.isPinned,
            pinnedAt: payload.pinnedAt,
          })),
      )
    }

    socket.on("private-message", handlePrivateMessage)
    socket.on("message:updated", handleUpdated)
    socket.on("message:deleted", handleDeleted)
    socket.on("message:pinned", handlePinned)

    return () => {
      socket.off("private-message", handlePrivateMessage)
      socket.off("message:updated", handleUpdated)
      socket.off("message:deleted", handleDeleted)
      socket.off("message:pinned", handlePinned)
    }
  }, [chatPublicId, channelPublicId, queryClient])
}
