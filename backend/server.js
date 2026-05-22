import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import Message from "./src/models/message.model.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// create http server
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://dev-connect-liard.vercel.app",
  "https://dev-connect-88pk3dcy5-ritiks-projects-b980f58e.vercel.app"
];

const socketCorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("Socket CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  credentials: true,
  transports: ["websocket", "polling"],
};

// socket.io setup
const io = new Server(server, {
  cors: socketCorsOptions,
  pingInterval: 25000,
  pingTimeout: 60000,
  allowEIO3: true,
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 1_000_000,
});

// store online users
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!userId || !socketId) return;
  onlineUsers.set(userId, socketId);
};

const removeOnlineUser = (socketId) => {
  for (const [userId, id] of onlineUsers.entries()) {
    if (id === socketId) {
      onlineUsers.delete(userId);
      return userId;
    }
  }
  return null;
};

const getSocketId = (userId) => onlineUsers.get(userId);

const sendToUser = (event, payload, userId) => {
  const targetSocketId = getSocketId(userId);
  if (!targetSocketId) {
    console.warn(`Signal target offline or not joined: ${userId}`);
    return false;
  }
  io.to(targetSocketId).emit(event, payload);
  return true;
};

app.set("socketio", io);
app.set("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  const handleJoin = (userId) => {
    if (!userId) {
      console.warn("join event received without userId from socket:", socket.id);
      return;
    }
    addOnlineUser(userId, socket.id);
    socket.join(userId);
    console.log("User joined:", userId, socket.id);
  };

  socket.on("join", handleJoin);
  socket.on("join-call", handleJoin);

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
      const receiverSocketId = getSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", newMessage);
      }

      // Echo back to sender so their message appears without a page refresh
      const senderSocketId = getSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", newMessage);
      }
    } catch (error) {
      console.error("MESSAGE ERROR:", error);
    }
  });

  // delete message
  // Frontend sends { messageId, senderId, receiverId }
  socket.on("deleteMessage", ({ messageId, senderId, receiverId }) => {
    const receiverSocketId = getSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }
    const senderSocketId = getSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }
  });

  // --- WebRTC Video Call Signaling ---

  const forwardOffer = ({ userToCall, signalData, from, callerInfo }) => {
    console.log("Offer received from:", from, "to:", userToCall);
    const payload = { signal: signalData, from, callerInfo };
    const success = sendToUser("incomingCall", payload, userToCall);
    if (success) {
      io.to(getSocketId(userToCall)).emit("incoming-call", payload);
      console.log("Incoming offer forwarded to:", userToCall);
    }
  };

  socket.on("callUser", forwardOffer);
  socket.on("call-user", forwardOffer);

  const forwardAnswer = ({ to, signal }) => {
    console.log("Answer received from:", socket.id, "to:", to);
    const success = sendToUser("callAccepted", signal, to);
    if (success) {
      io.to(getSocketId(to)).emit("answer-call", signal);
      console.log("Answer forwarded to caller:", to);
    }
  };

  socket.on("answerCall", forwardAnswer);
  socket.on("answer-call", forwardAnswer);

  const forwardIceCandidate = ({ to, candidate }) => {
    console.log("ICE candidate received from:", socket.id, "to:", to);
    const success = sendToUser("iceCandidate", candidate, to);
    if (success) {
      io.to(getSocketId(to)).emit("ice-candidate", candidate);
      console.log("ICE candidate forwarded to:", to);
    }
  };

  socket.on("iceCandidate", forwardIceCandidate);
  socket.on("ice-candidate", forwardIceCandidate);

  const forwardEndCall = ({ to }) => {
    console.log("Call ended request from:", socket.id, "to:", to);
    const success = sendToUser("endCall", null, to);
    if (success) {
      io.to(getSocketId(to)).emit("call-ended");
      console.log("Call ended forwarded to:", to);
    }
  };

  socket.on("endCall", forwardEndCall);
  socket.on("call-ended", forwardEndCall);

  // disconnect
  socket.on("disconnect", (reason) => {
    const userId = removeOnlineUser(socket.id);
    console.log("Socket disconnected:", socket.id, "reason:", reason, "userId:", userId);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Set a different PORT in .env or stop the process using it.`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();