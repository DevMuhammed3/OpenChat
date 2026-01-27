import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service.js'
// import { serialize } from 'cookie'
import { prisma } from '../config/prisma.js'
import { serialize } from 'cookie'
import { getCookieOptions } from '../utils/cookie.js'
import { sendOTPEmail } from '../utils/email.js'
import { generateOTP } from '../utils/otp.js'

export class AuthController {

  static async verifyEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { code } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.json({ verified: true });
      }

      const otp = await prisma.emailOTP.findFirst({
        where: {
          email: user.email,
          code,
        },
      });

      if (!otp || otp.expiresAt < new Date()) {
        return res
          .status(400)
          .json({ message: "Invalid or expired code" });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });

      await prisma.emailOTP.deleteMany({
        where: { email: user.email },
      });

      res.json({ verified: true });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }

  static async resendEmailOTP(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res
          .status(400)
          .json({ message: "Email already verified" });
      }

      await prisma.emailOTP.deleteMany({
        where: { email: user.email },
      });

      const code = generateOTP();

      await prisma.emailOTP.create({
        data: {
          email: user.email,
          code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      await sendOTPEmail(user.email, code);

      res.json({ message: "Verification code resent" });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  }


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
          emailVerified: true,
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
