import { Router } from "express";
import { friendController } from "../controllers/friend.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Protected routes
router.get("/search", authMiddleware, friendController.searchUser);
router.get("/requests", authMiddleware, friendController.getRequests);
router.get("/list", authMiddleware, friendController.getFriends);
router.post("/request/", authMiddleware, friendController.sendRequest);
router.post("/accept/:id", authMiddleware, friendController.acceptRequest);
router.delete("/reject/:id", authMiddleware, friendController.rejectRequest);

export default router;

