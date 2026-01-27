import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: Router = Router();

// Login
router.post("/resend-email", authMiddleware, AuthController.resendEmailOTP);
router.post("/verify-email", authMiddleware, AuthController.verifyEmail);

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected
router.get("/me", authMiddleware, AuthController.me)

// Logout
router.post("/logout", authMiddleware, AuthController.logout)

export default router;
