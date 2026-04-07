import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser
} from "../controllers/user.controller.js";

const userRouter = Router();

//  Search
userRouter.get("/search", protect, searchUsers);

//  Update profile
userRouter.put("/update", protect, updateProfile);

//  Follow system
userRouter.put("/follow/:id", protect, followUser);
userRouter.put("/unfollow/:id", protect, unfollowUser);

//  Get user profile (dynamic route ALWAYS last)
userRouter.get("/:id", protect, getUserProfile);

export default userRouter;