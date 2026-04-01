import { z } from "zod"
import { chatPublicIdSchema } from "./chat.validation.js"

export const joinRoomSchema = z.object({
  chatPublicId: chatPublicIdSchema,
  channelPublicId: z.string().trim().min(1).optional(),
})

export const leaveRoomSchema = z.object({
  chatPublicId: chatPublicIdSchema,
  channelPublicId: z.string().trim().min(1).optional(),
})

export const chatTypingSchema = z.object({
  chatPublicId: chatPublicIdSchema,
  isTyping: z.boolean(),
})

export const privateMessageSchema = z
  .object({
    chatPublicId: chatPublicIdSchema,
    channelPublicId: z.string().trim().min(1).nullable().optional(),
    text: z.string().trim().min(1).nullable().optional(),
    fileUrl: z.string().trim().min(1).nullable().optional(),
    fileType: z.string().trim().min(1).nullable().optional(),
  })
  .refine((payload) => Boolean(payload.text?.trim()) || Boolean(payload.fileUrl?.trim()), {
    message: "Message must include text or a fileUrl",
  })

