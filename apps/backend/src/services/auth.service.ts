import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { generateToken } from "../utils/generateToken.js";

export class AuthService {
  static async register(name: string, username: string, email: string, password: string) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("User already exists");

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {name, username, email, password: hashed },
    });

    const token = generateToken(user.id);
    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const token = generateToken(user.id);
    return { user, token };
  }
}