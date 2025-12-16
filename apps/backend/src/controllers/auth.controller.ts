import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service.js'
// import { serialize } from 'cookie'
import { prisma } from '../config/prisma.js'
import { serialize } from 'cookie'
import { getCookieOptions } from '../utils/cookie.js'

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { name, username, email, password } = req.body
            const { user, token } = await AuthService.register(
                name,
                username,
                email,
                password
            )

            // Set cookie (HTTPOnly)
            const cookie = serialize('token', token, getCookieOptions(req))
            res.setHeader('Set-Cookie', cookie)
            res.json({ user })
        } catch (err: any) {
            res.status(400).json({ message: "Something wrong!" })
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body
            const { user, token } = await AuthService.login(email, password)

            const cookie = serialize('token', token, getCookieOptions(req))
            res.setHeader('Set-Cookie', cookie)
            res.json({ user })
        } catch (err: any) {
            res.status(400).json({ message: "Something wrong!" })
        }
    }

    static async me(req: Request, res: Response) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ message: 'Not authenticated' })
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                },
            })

            if (!user)
                return res.status(404).json({ message: 'User not found' })

            res.json({ user })
        } catch (err: any) {
            res.status(500).json({ message: 'Server Error' })
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const cookie = serialize('token', '', {
                ...getCookieOptions(req),
                maxAge: 0,
            })

            res.setHeader('Set-Cookie', cookie)
            res.json({ message: 'logged out successfully!' })
        } catch (err: any) {
            res.status(500).json({ message: 'Server err' })
        }
    }
}
