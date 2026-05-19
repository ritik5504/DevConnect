import { createContext, useContext, useState, useEffect, useRef } from "react";
import API from "../api/axios";
import socket from "../socket/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Unread counters
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadSenders, setUnreadSenders] = useState({});

  // Track if the user is currently viewing chat (to suppress message badge)
  const onChatPage = useRef(false);

  useEffect(() => {
    const count = Object.values(unreadSenders).reduce((sum, val) => sum + val, 0);
    setUnreadMessages(count);
  }, [unreadSenders]);

  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user);
      setIsAuthenticated(true);
      if (!socket.connected) {
        socket.connect();
        socket.emit("join", res.data.user._id);
      }
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for incoming messages globally to track unread count
  useEffect(() => {
    const handleReceive = (msg) => {
      // Only increment badge if:
      // 1. A message was sent TO the current user
      // 2. They are NOT currently on the chat page
      const receiverId = msg.receiver?._id || msg.receiver;
      const senderId = msg.sender?._id || msg.sender;
      if (
        user &&
        receiverId === user._id &&
        !onChatPage.current
      ) {
        setUnreadSenders((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
        // Also bump notification count for message notifications
        setUnreadNotifications((prev) => prev + 1);
      }
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [user]);

  // Listen for incoming notifications globally
  useEffect(() => {
    const handleNotification = (notif) => {
      setUnreadNotifications((prev) => prev + 1);
    };

    socket.on("newNotification", handleNotification);
    return () => socket.off("newNotification", handleNotification);
  }, []);

  const login = (accessToken, userData) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    if (!socket.connected) {
      socket.connect();
      socket.emit("join", userData._id);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setUnreadSenders({});
    setUnreadNotifications(0);
    socket.disconnect();
  };

  const clearUnreadMessages = () => setUnreadSenders({});
  const clearUnreadNotifications = () => setUnreadNotifications(0);
  const setOnChatPage = (val) => { onChatPage.current = val; };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        unreadMessages,
        unreadNotifications,
        clearUnreadMessages,
        clearUnreadNotifications,
        setOnChatPage,
        unreadSenders,
        setUnreadSenders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);