import type { Response } from "express"
import { z } from "zod"

export function respondWithZodError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    message: "Invalid request",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  })
}

export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError
}

