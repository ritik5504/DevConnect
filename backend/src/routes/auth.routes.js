import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const authRouter = Router();

/**
 * REFRESH TOKEN
 */
authRouter.post("/refresh-token", authController.refreshAccessToken);

/**
 * REGISTER
 */
authRouter.post("/register", authController.register);

/**
 * LOGIN
 */
authRouter.post("/login", authController.login);

/**
 * GET CURRENT USER (Protected)
 */
authRouter.get("/me", protect, authController.getMe);


authRouter.post("/refresh-token", authController.refreshAccessToken);

authRouter.post("/logout", authController.logout);

authRouter.post("/logout-all", protect, authController.logoutAll);

export default authRouter;