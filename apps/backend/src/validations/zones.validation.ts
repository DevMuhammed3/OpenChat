import { z } from "zod"

function coerceNumberArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []

    // Accept JSON arrays and comma-separated lists.
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        }
      } catch {
        // Fall through to CSV parsing.
      }
    }

    return trimmed
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item))
  }

  return []
}

export const zoneChatPublicIdParamsSchema = z.object({
  chatPublicId: z.string().trim().min(1),
})

export const zoneInviteCodeParamsSchema = z.object({
  code: z.string().trim().min(1),
})

export const zoneMemberParamsSchema = z.object({
  chatPublicId: z.string().trim().min(1),
  userId: z.coerce.number().int().positive(),
})

export const createGroupBodySchema = z
  .object({
    name: z.string().trim().min(1),
    users: z.preprocess(coerceNumberArray, z.array(z.number().int().positive()).max(50).optional()).optional(),
  })
  .passthrough()

export const updateZoneBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
  })
  .passthrough()

export const addUsersBodySchema = z
  .object({
    userIds: z.preprocess(coerceNumberArray, z.array(z.number().int().positive()).min(1).max(50)),
  })
  .strict()

export const createChannelBodySchema = z
  .object({
    name: z.string().trim().min(1),
    type: z.enum(["TEXT", "VOICE"]).optional(),
  })
  .strict()

export const updateMemberRoleBodySchema = z
  .object({
    role: z.enum(["ADMIN", "MEMBER"]),
  })
  .strict()

