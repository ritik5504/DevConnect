import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  updateProfile
} from "../controllers/user.controller.js";

import { followUser, unfollowUser } from "../controllers/user.controller.js";

const userRouter = Router();

// Get user profile
userRouter.get("/:id", protect, getUserProfile);

// Update profile
userRouter.put("/update", protect, updateProfile);

// Follow / Unfollow
userRouter.put("/follow/:id", protect, followUser);
userRouter.put("/unfollow/:id", protect, unfollowUser);

export default userRouter;