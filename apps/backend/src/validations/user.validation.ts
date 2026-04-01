import { z } from "zod"

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
})

export const usernameParamsSchema = z.object({
  username: z.string().trim().min(1),
})

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    username: z.string().trim().min(3).max(30).optional(),
    bio: z.preprocess((value) => (value === null ? "" : value), z.string().trim().max(2000).optional()),
  })
  .strict()
