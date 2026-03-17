import { Router } from "express"
import { getIceServers, getLiveKitToken } from "../controllers/webrtc.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.get("/ice", getIceServers)
router.get("/token", authMiddleware, getLiveKitToken)

export default router
