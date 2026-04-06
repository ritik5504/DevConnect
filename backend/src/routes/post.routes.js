import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createPost,
  getPosts,
  likePost,
  addComment,
} from "../controllers/post.controller.js";

const router = Router();

router.post("/", protect, createPost);
router.get("/", protect, getPosts);
router.put("/like/:id", protect, likePost);
router.post("/comment/:id", protect, addComment);

export default router;