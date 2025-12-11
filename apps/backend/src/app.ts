import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import friendRoutes from "./routes/friend.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

export const app: Express = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "https://openchat.qzz.io",
  process.env.NEXT_PUBLIC_API_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow mobile apps or curl/postman (no origin)
      if (!origin) return callback(null, true);

      // Allow local & vercel origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Cloudflare Tunnel (dynamic domain)
      if (origin.endsWith(".trycloudflare.com")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// API routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/friends", friendRoutes);
app.use("/messages", messageRoutes);
