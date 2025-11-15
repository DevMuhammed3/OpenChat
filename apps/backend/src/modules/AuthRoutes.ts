import { Router } from "express";
import { loginHandler, meHandler, registerHandler } from "./auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router: import("express").Router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", authMiddleware, meHandler);

export default router;