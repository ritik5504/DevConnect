import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import Message from "./src/models/message.model.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── CORS origins ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://dev-connect-liard.vercel.app",
  "https://dev-connect-88pk3dcy5-ritiks-projects-b980f58e.vercel.app",
];

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("[Socket] CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  allowEIO3: true,
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 1_000_000,
});

// ── Online user registry ──────────────────────────────────────────────────────
// userId → socketId
const onlineUsers = new Map();

const addUser    = (userId, socketId) => { if (userId && socketId) onlineUsers.set(userId, socketId); };
const removeUser = (socketId)         => {
  for (const [uid, sid] of onlineUsers) {
    if (sid === socketId) { onlineUsers.delete(uid); return uid; }
  }
  return null;
};
const getSocketId = (userId) => onlineUsers.get(userId);

/** Emit an event to a specific userId. Returns true if the user is online. */
const emitToUser = (userId, event, payload) => {
  const sid = getSocketId(userId);
  if (!sid) {
    console.warn(`[Socket] ${event} → user offline: ${userId}`);
    return false;
  }
  io.to(sid).emit(event, payload);
  console.log(`[Socket] ${event} → ${userId} (${sid})`);
  return true;
};

// ── Expose to Express routes (notifications etc.) ────────────────────────────
app.set("socketio", io);
app.set("onlineUsers", onlineUsers);

// ── Connection handler ────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("[Socket] connected:", socket.id);

  // ── Join: register userId → socketId ──────────────────────────────────────
  const handleJoin = (userId) => {
    if (!userId) return;
    addUser(userId, socket.id);
    socket.join(userId);  // join a room named by userId so io.to(userId) also works
    console.log("[Socket] joined:", userId, "→", socket.id);
  };
  socket.on("join",      handleJoin);
  socket.on("join-call", handleJoin);

  // ── Chat: send message ─────────────────────────────────────────────────────
  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    try {
      const msg = await Message.create({ sender: senderId, receiver: receiverId, text });
      emitToUser(receiverId, "receiveMessage", msg);
      emitToUser(senderId,   "receiveMessage", msg);
    } catch (err) {
      console.error("[Socket] sendMessage error:", err.message);
    }
  });

  // ── Chat: delete message ───────────────────────────────────────────────────
  socket.on("deleteMessage", ({ messageId, senderId, receiverId }) => {
    emitToUser(receiverId, "messageDeleted", { messageId });
    emitToUser(senderId,   "messageDeleted", { messageId });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  WebRTC signaling — each message forwarded ONCE using emitToUser
  // ══════════════════════════════════════════════════════════════════════════

  // Caller → Server → Callee: send offer
  socket.on("callUser", ({ userToCall, signalData, from, callerInfo }) => {
    console.log("[WebRTC] offer:", from, "→", userToCall);
    emitToUser(userToCall, "incomingCall", { signal: signalData, from, callerInfo });
  });

  // Callee → Server → Caller: send answer
  socket.on("answerCall", ({ to, signal }) => {
    console.log("[WebRTC] answer:", socket.id, "→", to);
    emitToUser(to, "callAccepted", signal);
  });

  // Either side → Server → Other side: ICE candidate
  socket.on("iceCandidate", ({ to, candidate }) => {
    console.log("[WebRTC] ice-candidate:", socket.id, "→", to);
    emitToUser(to, "iceCandidate", candidate);
  });

  // Either side → Server → Other side: end call
  socket.on("endCall", ({ to }) => {
    console.log("[WebRTC] endCall:", socket.id, "→", to);
    emitToUser(to, "endCall", null);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    const uid = removeUser(socket.id);
    console.log("[Socket] disconnected:", socket.id, "reason:", reason, "userId:", uid);
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} already in use`);
      } else {
        console.error("Server error:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();