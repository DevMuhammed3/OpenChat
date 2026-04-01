import { useMutation, useQueryClient } from "@tanstack/react-query"
import { channelKeys } from "@/features/channels/queries"
import type { ChannelType, ZoneChannel } from "@/features/channels/types"
import { apiClient } from "@/lib/api/client"

type ChannelResponse = {
  channel: ZoneChannel
}

export function useCreateChannelMutation(zonePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      type,
    }: {
      name: string
      type: ChannelType
    }) => {
      const data = await apiClient.post<ChannelResponse>(`/zones/${zonePublicId}/channels`, {
        name,
        type,
      })

      return data.channel
    },
    onSuccess(channel) {
      queryClient.setQueryData<ZoneChannel[]>(channelKeys.list(zonePublicId), (current = []) => {
        const withoutExisting = current.filter((item) => item.publicId !== channel.publicId)
        return [...withoutExisting, channel]
      })
    },
  })
}
