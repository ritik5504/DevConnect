import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMessages, deleteMessage, deleteConversation } from "../controllers/message.controller.js";

const messageRouter = Router();

// Get chat history
messageRouter.get("/:userId", protect, getMessages);

// Delete a message (sender only)
messageRouter.delete("/:id", protect, deleteMessage);

// Delete entire conversation
messageRouter.delete("/conversation/:userId", protect, deleteConversation);

export default messageRouter;