import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  updateProfile,
  searchUsers,
  followUser,
  unfollowUser,
  getConnections
} from "../controllers/user.controller.js";

const userRouter = Router();

//  Search
userRouter.get("/search", protect, searchUsers);

//  Connections (followers + following)
userRouter.get("/connections", protect, getConnections);

//  Update profile
userRouter.put("/update", protect, updateProfile);

//  Follow system
userRouter.put("/follow/:id", protect, followUser);
userRouter.put("/unfollow/:id", protect, unfollowUser);

//  Get user profile (dynamic route ALWAYS last)
userRouter.get("/:id", protect, getUserProfile);

export default userRouter;