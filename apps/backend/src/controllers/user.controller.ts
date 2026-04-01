import { Request, Response } from 'express'
import { UserService } from '../services/user.service.js'
import { updateProfileBodySchema } from "../validations/user.validation.js"
import { respondWithZodError } from "../utils/zodError.js"

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const parsed = updateProfileBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error)
    }

    const { name, username, bio } = parsed.data

    const user = await UserService.updateProfile(userId, {
      name,
      username,
      bio,
    })

    res.json({ user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request"
    res.status(400).json({ message })
  }
}

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const user = await UserService.updateAvatar(userId, req.file.filename)

    res.json({ user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request"
    res.status(400).json({ message })
  }
}

export const removeAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const user = await UserService.removeAvatar(userId)

    res.json({ user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request"
    res.status(400).json({ message })
  }
}
