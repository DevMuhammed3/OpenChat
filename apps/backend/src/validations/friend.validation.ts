import { z } from "zod"

export const friendRequestBodySchema = z
  .object({
    username: z.string().trim().min(1),
  })
  .strict()

export const friendSearchQuerySchema = z.object({
  username: z.string().trim().min(1),
})

export const friendRequestIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const friendUserIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
})

