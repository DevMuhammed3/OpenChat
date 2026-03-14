import { prisma } from '../config/prisma.js'
import fs from 'fs'
import path from 'path'

export class UserService {

  static async updateProfile(
    userId: number,
    data: {
      name?: string
      username?: string
      bio?: string
    }
  ) {
    const updateData: any = {}

    if (data.name !== undefined) {
      const name = data.name.trim()
      if (name.length < 2) {
        throw new Error('Full name must be at least 2 characters')
      }
      updateData.name = name
    }

    if (data.username !== undefined) {
      const username = data.username.trim()
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      const existing = await prisma.user.findUnique({
        where: { username },
      })

      if (existing && existing.id !== userId) {
        throw new Error('Username already taken')
      }

      updateData.username = username
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio.trim()
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        emailVerified: true,
      },
    })
  }

  static async updateAvatar(userId: number, filename: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.avatar) {
      const oldPath = path.join('uploads', user.avatar)
      try {
        await fs.promises.unlink(oldPath)
      } catch { }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { avatar: filename },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        emailVerified: true,
      },
    })
  }
  
  static async removeAvatar(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.avatar) {
      const oldPath = path.join('uploads', user.avatar)
      try {
        await fs.promises.unlink(oldPath)
      } catch { }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        emailVerified: true,
      },
    })
  }
}
