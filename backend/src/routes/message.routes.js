import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMessages } from "../controllers/message.controller.js";

const messageRouter = Router();

// Get chat history
messageRouter.get("/:userId", protect, getMessages);

export default messageRouter;