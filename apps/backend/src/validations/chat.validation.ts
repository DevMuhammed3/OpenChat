import { z } from "zod"

export const chatPublicIdSchema = z.string().trim().min(1)

export const getChatMessagesQuerySchema = z.object({
  cursor: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") return undefined
      const asNumber = Number(value)
      return Number.isFinite(asNumber) ? asNumber : value
    }, z.number().int().positive().optional())
    .optional(),
  channelPublicId: z.string().trim().min(1).optional(),
})

export const startChatBodySchema = z.object({
  friendId: z.preprocess((value) => Number(value), z.number().int().positive()),
})

export const getChatParamsSchema = z.object({
  chatPublicId: chatPublicIdSchema,
})

