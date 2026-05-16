import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createPost,
  getPosts,
  likePost,
  addComment,
  deletePost,
  getFeed,
} from "../controllers/post.controller.js";

const router = Router();

router.post("/", protect, createPost);
router.get("/feed", protect, getFeed);
router.get("/", protect, getPosts);
router.put("/like/:id", protect, likePost);
router.post("/comment/:id", protect, addComment);
router.delete("/:id", protect, deletePost);

export default router;