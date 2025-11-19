import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router: Router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

export default router;