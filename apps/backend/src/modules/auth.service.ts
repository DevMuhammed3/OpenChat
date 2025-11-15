import { prisma } from '../prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'

export async function registerUser(
    email: string,
    password: string,
    name: string,
    username: string
) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        throw new Error('Email already in use')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            name: name,
            username: username,
            email: email,
            password: passwordHash,
        },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            createdAt: true,
        },
    })

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
        expiresIn: '1h',
    })

    return { user, token }
}

export async function loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        throw new Error('Invalid email or password')
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        throw new Error('Invalid email or password')
    }

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
        expiresIn: '1h',
    })

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        },
        token,
    }
}
