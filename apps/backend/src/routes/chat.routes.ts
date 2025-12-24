import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getChatMessages,
    getChats,
    startChat,
} from "../controllers/chat.controller.js";

const router = Router();

router.get("/", authMiddleware, getChats);

router.post("/start", authMiddleware, startChat);

router.get(
  "/:chatPublicId/messages",
  authMiddleware,
  getChatMessages
);

export default router;

