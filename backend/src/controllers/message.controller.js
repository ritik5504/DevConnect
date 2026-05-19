import Message from "../models/message.model.js";

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();

    // Attach receiverId so server.js can broadcast to the right person
    res.json({ message: "Message deleted", messageId: req.params.id, receiverId: message.receiver.toString() });
  } catch (error) {
    console.error("DELETE MESSAGE ERROR:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    });

    const io = req.app.get("socketio");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const receiverSocketId = onlineUsers.get(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("conversationDeleted", { senderId: req.user.id });
      }
    }

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("DELETE CONVERSATION ERROR:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};