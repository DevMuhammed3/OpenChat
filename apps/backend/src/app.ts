// apps/backend/src/app.ts
import express, { Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
