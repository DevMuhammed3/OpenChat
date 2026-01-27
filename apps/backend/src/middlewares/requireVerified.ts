import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email to use this feature",
      });
    }

    next();
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

