import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getChatMessages,
  getChats,
  startChat,
  editMessage,
  deleteMessage,
  uploadFile,
} from "../controllers/chat.controller.js";

const router = Router();

router.get("/", authMiddleware, getChats)
router.post("/start", authMiddleware, startChat)

router.get(
  "/:chatPublicId/messages",
  authMiddleware,
  getChatMessages
)

router.post(
  "/:chatPublicId/upload",
  authMiddleware,
  uploadFile
)

router.patch("/messages/:id", authMiddleware, editMessage)

router.delete("/messages/:id", authMiddleware, deleteMessage)

export default router;

