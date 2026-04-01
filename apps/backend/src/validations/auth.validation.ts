import { z } from "zod"

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(2).max(50),
    username: z.string().trim().min(3).max(30),
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict()

export const loginBodySchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict()

export const verifyEmailBodySchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .strict()

export const googleLoginBodySchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .strict()

