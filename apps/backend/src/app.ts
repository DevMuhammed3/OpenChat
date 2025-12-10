// apps/backend/src/app.ts
import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import friendRoutes from "./routes/friend.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

export const app: Express = express();

app.use(cors({
  origin: process.env.ORIGIN || "*",
  credentials: true,
}));

// app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/friends", friendRoutes);
app.use("/messages", messageRoutes);
