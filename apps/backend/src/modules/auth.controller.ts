import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service.js";
import { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, name, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await registerUser(email, password, name, username);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Registration failed" });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await loginUser(email, password);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Login failed" });
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ message: "Something went wrong" });
  }
}