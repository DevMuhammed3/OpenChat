import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service.js'

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { name, username, email, password } = req.body
            const result = await AuthService.register(
                name,
                username,
                email,
                password
            )
            res.json(result)
        } catch (err: any) {
            res.status(400).json({ message: err.message })
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body
            const result = await AuthService.login(email, password)
            res.json(result)
        } catch (err: any) {
            res.status(400).json({ message: err.message })
        }
    }

    static async getProfile(req: any, res: any) {
        try {
            const userId = req.user.id

            const result = await AuthService.getProfile(userId)
            res.json(result)
        } catch (err: any) {
            res.status(400).json({ message: err.message })
        }
    }
}