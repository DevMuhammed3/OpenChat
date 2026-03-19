import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  addUserToGroup,
  createGroup,
  createChannel,
  createZoneInvite,
  getZoneChannels,
  getZoneInvite,
  getZoneMembers,
  getZoneVoicePresence,
  getZones,
  joinZoneInvite,
  leaveZone,
  removeUserFromGroup,
  updateZone,
  updateZoneMemberRole,
} from "../controllers/zones.controller.js";
import { uploadFile } from "../controllers/chat.controller.js";

const router = Router();

router.get("/", authMiddleware, getZones);
router.get("/invites/:code", authMiddleware, getZoneInvite);
router.get("/:chatPublicId/members", authMiddleware, getZoneMembers);
router.get("/:chatPublicId/channels", authMiddleware, getZoneChannels);
router.get("/:chatPublicId/voice-presence", authMiddleware, getZoneVoicePresence);
router.post("/:chatPublicId/upload", authMiddleware, uploadFile);
router.post("/", authMiddleware, createGroup);
router.post("/invites/:code/join", authMiddleware, joinZoneInvite);
router.post("/:chatPublicId/channels", authMiddleware, createChannel);
router.post("/:chatPublicId/invites", authMiddleware, createZoneInvite);
router.post("/:chatPublicId/members", authMiddleware, addUserToGroup);
router.post("/:chatPublicId/leave", authMiddleware, leaveZone);
router.patch("/:chatPublicId", authMiddleware, ...updateZone);
router.patch("/:chatPublicId/members/:userId/role", authMiddleware, updateZoneMemberRole);
router.delete("/:chatPublicId/members/:userId", authMiddleware, removeUserFromGroup);


export default router
