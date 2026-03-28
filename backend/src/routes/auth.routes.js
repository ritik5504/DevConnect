import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const authRouter = Router();

/**
 * POST /api/auth/register
 */
authRouter.post("/register", authController.register);

/**
 * POST /api/auth/login
 */
authRouter.post("/login", authController.login);

/**
 * GET /api/auth/me (Protected)
 */
authRouter.get("/me", protect, authController.getMe);

export default authRouter;