import { z } from "zod"

export const livekitTokenQuerySchema = z.object({
  roomType: z.enum(["dm", "channel"]),
  roomId: z.string().trim().min(1),
})

