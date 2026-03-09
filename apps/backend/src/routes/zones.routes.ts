import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  addUserToGroup,
  createGroup,
  getZoneMembers,
  getZones, leaveZone, removeUserFromGroup
} from "../controllers/zones.controller.js";

const router = Router();

router.get("/", authMiddleware, getZones);
router.get("/:chatPublicId/members", authMiddleware, getZoneMembers);
router.post("/", authMiddleware, createGroup);
router.post("/:chatPublicId/members", authMiddleware, addUserToGroup);
router.post("/:chatPublicId/leave", authMiddleware, leaveZone);
router.delete("/:chatPublicId/members/:userId", authMiddleware, removeUserFromGroup);


export default router
