import { io } from "socket.io-client";

const socketURL = import.meta.env.VITE_API_URL || "https://devconnect-gn8n.onrender.com";

const socket = io(socketURL, {
  autoConnect: false,
});

export default socket;
