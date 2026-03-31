import { useMutation, useQueryClient } from "@tanstack/react-query"
import { socket } from "@openchat/lib"
import { apiClient } from "@/lib/api/client"
import { mergeMessage, messageKeys } from "@/features/chat/queries"
import type { ChannelMessage, SendChannelMessageInput } from "@/features/chat/types"
import { useUser } from "@/features/user/queries"

type StartChatResponse = {
  chatPublicId: string
}

type UploadResponse = {
  fileUrl: string
  fileType: string
}

function emitChannelMessage(message: {
  chatPublicId: string
  channelPublicId: string
  text: string | null
  fileUrl?: string | null
  fileType?: string | null
}) {
  return new Promise<ChannelMessage>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Timed out while sending message"))
    }, 10_000)

    socket.emit("private-message", message, (savedMessage: ChannelMessage | undefined) => {
      window.clearTimeout(timer)

      if (!savedMessage || typeof savedMessage.id !== "number") {
        reject(new Error("Message could not be confirmed by the server"))
        return
      }

      resolve(savedMessage)
    })
  })
}

export function useStartDirectMessageMutation() {
  return useMutation({
    mutationFn: async (friendId: number) => {
      const data = await apiClient.post<StartChatResponse>("/chats/start", { friendId })
      return data.chatPublicId
    },
  })
}

export function useSendChannelMessageMutation(chatPublicId: string, channelPublicId: string) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useUser()

  return useMutation({
    mutationFn: async ({ text, file }: SendChannelMessageInput) => {
      const nextText = text?.trim() ?? ""

      if (!nextText && !file) {
        throw new Error("Message content is empty")
      }

      let uploadedFile: UploadResponse | null = null

      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        uploadedFile = await apiClient.post<UploadResponse>(`/zones/${chatPublicId}/upload`, formData)
      }

      return emitChannelMessage({
        chatPublicId,
        channelPublicId,
        text: nextText || null,
        fileUrl: uploadedFile?.fileUrl ?? null,
        fileType: uploadedFile?.fileType ?? file?.type ?? null,
      })
    },
    onMutate({ file, previewUrl, text }) {
      const temporaryId = -Date.now()
      const previousMessages = queryClient.getQueryData<ChannelMessage[]>(
        messageKeys.list(chatPublicId, channelPublicId),
      )

      queryClient.setQueryData<ChannelMessage[]>(
        messageKeys.list(chatPublicId, channelPublicId),
        (current = []) =>
          mergeMessage(current, {
            id: temporaryId,
            chatPublicId,
            channelPublicId,
            text: text?.trim() || null,
            senderId: currentUser?.id ?? -1,
            sender: currentUser
              ? {
                  id: currentUser.id,
                  username: currentUser.username,
                  avatar: currentUser.avatar ?? null,
                }
              : undefined,
            fileUrl: previewUrl ?? null,
            fileType: file?.type ?? null,
            createdAt: new Date().toISOString(),
          }),
      )

      return { previousMessages, temporaryId }
    },
    onError(_error, _variables, context) {
      queryClient.setQueryData(
        messageKeys.list(chatPublicId, channelPublicId),
        context?.previousMessages ?? [],
      )
    },
    onSuccess(message, _variables, context) {
      queryClient.setQueryData<ChannelMessage[]>(
        messageKeys.list(chatPublicId, channelPublicId),
        (current = []) => {
          const withoutOptimistic = current.filter((item) => item.id !== context?.temporaryId)
          return mergeMessage(withoutOptimistic, message)
        },
      )
    },
  })
}
