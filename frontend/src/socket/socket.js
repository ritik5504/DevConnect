import { io } from "socket.io-client";

const socketURL = import.meta.env.VITE_API_URL || "https://devconnect-gn8n.onrender.com";

console.log("[Socket] Connecting to:", socketURL);

const socket = io(socketURL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"],
  withCredentials: true
});

socket.on("connect", () => {
  console.log("[Socket] Connected with ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("[Socket] Disconnected - Reason:", reason);
});

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error);
});

export default socket;
