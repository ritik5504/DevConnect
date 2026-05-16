import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import Message from "./src/models/message.model.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// create http server
const server = http.createServer(app);

// socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// store online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join event
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Online users:", onlineUsers);
  });

  // send message
  // Frontend sends { senderId, receiverId, text }
  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    try {
      // Save message to DB
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
      });

      // Emit to receiver (if online)
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", newMessage);
      }

      // Echo back to sender so their message appears without a page refresh
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", newMessage);
      }
    } catch (error) {
      console.error("MESSAGE ERROR:", error);
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();