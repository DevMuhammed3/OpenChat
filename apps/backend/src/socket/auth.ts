import jwt from "jsonwebtoken"
import { Socket } from "socket.io"

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const cookie = socket.request.headers.cookie
    if (!cookie) return next(new Error("No auth cookie"))

    const token = cookie
      .split("; ")
      .find(c => c.startsWith("token="))
      ?.split("=")[1]

    if (!token) return next(new Error("No token"))

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number }

    socket.data.userId = decoded.id
    next()
  } catch {
    next(new Error("Unauthorized"))
  }
}

