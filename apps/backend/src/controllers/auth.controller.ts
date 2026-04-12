import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service.js'
import { prisma } from '../config/prisma.js'
import { serialize } from 'cookie'
import { getCookieOptions } from '../utils/cookie.js'
import { sendOTPEmail } from '../utils/email.js'
import { generateOTP } from '../utils/otp.js'
import {
  loginBodySchema,
  registerBodySchema,
  verifyEmailBodySchema,
} from "../validations/auth.validation.js"
import { respondWithZodError } from "../utils/zodError.js"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const PASSWORD_MIN_LENGTH = 8

interface ValidationError {
  field: string;
  message: string;
}

const validateRegistration = (data: { name?: string; username?: string; email?: string; password?: string }): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' })
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: 'Name must be less than 50 characters' })
  }

  if (!data.username || data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' })
  } else if (data.username.length > 30) {
    errors.push({ field: 'username', message: 'Username must be less than 30 characters' })
  } else if (!USERNAME_REGEX.test(data.username)) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers, and underscores' })
  }

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else {
    if (data.password.length < PASSWORD_MIN_LENGTH) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' })
    }
    if (!/[A-Z]/.test(data.password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' })
    }
    if (!/[0-9]/.test(data.password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one number' })
    }
  }

  return errors
}

const validateLogin = (data: { email?: string; password?: string }): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }

  return errors
}

export class AuthController {

  static async verifyEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const parsed = verifyEmailBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return respondWithZodError(res, parsed.error)
      }

      const { code } = parsed.data;

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
        return res.json({ verified: true, message: "Email already verified" });
      }

      const otp = await prisma.emailOTP.findFirst({
        where: {
          email: user.email,
          code: code.trim(),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!otp) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (otp.expiresAt < new Date()) {
        await prisma.emailOTP.delete({ where: { id: otp.id } });
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { emailVerified: true },
        }),
        prisma.emailOTP.deleteMany({
          where: { email: user.email },
        }),
      ]);

      res.json({ verified: true, message: "Email verified successfully" });
    } catch (error) {
      console.error("Verify Email Error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
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
        return res.status(400).json({ message: "Email already verified" });
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

      try {
        await sendOTPEmail(user.email, code);
      } catch (emailError) {
        console.error("Email send error:", emailError);
        return res.status(500).json({ message: "Failed to send verification email. Please try again." });
      }

      res.json({ message: "Verification code sent successfully" });
    } catch (error) {
      console.error("Resend OTP Error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const parsed = registerBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Invalid request",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path[0] ? String(issue.path[0]) : "body",
            message: issue.message,
          })),
        })
      }

      const { name, username, email, password } = parsed.data

      const validationErrors = validateRegistration({ name, username, email, password })
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: validationErrors[0].message,
          errors: validationErrors,
        })
      }

      const { user, token } = await AuthService.register(
        name.trim(),
        username.trim().toLowerCase(),
        email.trim().toLowerCase(),
        password
      )

      const cookie = serialize("token", token, {
        ...getCookieOptions(req),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      })
      res.setHeader("Set-Cookie", cookie)

      return res.status(201).json({ 
        user,
        message: "Account created successfully"
      })
    } catch (err: unknown) {
      console.error("REGISTER ERROR:", err)

      const errorObject = (typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null)
      const code = errorObject?.code

      if (code === "P2002") {
        const meta = errorObject?.meta
        const metaObject = (typeof meta === "object" && meta !== null ? (meta as Record<string, unknown>) : null)
        const target = metaObject?.target
        const field = Array.isArray(target) ? target[0] : undefined
        if (field === 'email') {
          return res.status(400).json({
            message: "An account with this email already exists",
            field: "email"
          })
        }
        if (field === 'username') {
          return res.status(400).json({
            message: "This username is already taken",
            field: "username"
          })
        }
        return res.status(400).json({
          message: "An account with these details already exists",
        })
      }

      return res.status(500).json({
        message: "Registration failed. Please try again.",
      })
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues[0]?.message ?? "Invalid request",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path[0] ? String(issue.path[0]) : "body",
            message: issue.message,
          })),
        })
      }

      const { email, password } = parsed.data

      const validationErrors = validateLogin({ email, password })
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: validationErrors[0].message,
          errors: validationErrors,
        })
      }

      const { user, token } = await AuthService.login(email.trim().toLowerCase(), password)

      const cookie = serialize('token', token, {
        ...getCookieOptions(req),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      })
      res.setHeader('Set-Cookie', cookie)
      res.json({ 
        user,
        message: "Login successful"
      })
    } catch (err: unknown) {
      console.error("LOGIN ERROR:", err)
      res.status(401).json({ message: "Invalid email or password" })
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
          avatar: true,
          bio: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      res.json({ user })
    } catch (err: unknown) {
      console.error("ME ERROR:", err)
      res.status(500).json({ message: 'Server Error' })
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const cookie = serialize('token', '', {
        ...getCookieOptions(req),
        maxAge: 0,
        expires: new Date(0),
      })

      res.setHeader('Set-Cookie', cookie)
      res.json({ message: 'Logged out successfully!' })
    } catch (err: unknown) {
      console.error("LOGOUT ERROR:", err)
      res.status(500).json({ message: 'Server error' })
    }
  }
}
