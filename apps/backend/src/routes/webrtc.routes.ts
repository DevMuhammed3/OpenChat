import { Router } from "express"
import { getIceServers } from "../controllers/webrtc.controller.js"

const router = Router()

router.get("/ice", getIceServers)

export default router

