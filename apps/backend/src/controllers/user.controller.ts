import { Request, Response } from 'express'
import { UserService } from '../services/user.service.js'

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { name, username, bio } = req.body

    const user = await UserService.updateProfile(userId, {
      name,
      username,
      bio,
    })

    res.json({ user })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
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
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
