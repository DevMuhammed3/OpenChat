import { Router } from "express";
import { friendController } from "../controllers/friend.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireVerified } from "../middlewares/requireVerified.js";

const router = Router();

// Protected routes
router.get("/search", authMiddleware, friendController.searchUser);
router.get("/pending", authMiddleware, friendController.pending);
router.get("/requests", authMiddleware, friendController.getRequests);
router.get("/list", authMiddleware, friendController.getFriends);
router.get("/blocked", authMiddleware, friendController.getBlockedUsers);
router.post("/request/", authMiddleware, requireVerified, friendController.sendRequest);
router.post("/accept/:id", authMiddleware, friendController.acceptRequest);
router.post("/block/:userId", authMiddleware, friendController.blockUser);
router.delete("/:userId", authMiddleware, friendController.removeFriend);
router.delete("/block/:userId", authMiddleware, friendController.unblockUser);
router.delete("/reject/:id", authMiddleware, friendController.rejectRequest);

export default router;
