import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import socket from "../socket/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user);
      setIsAuthenticated(true);
      // Connect socket and join room
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

  const login = (accessToken, userData) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    // Connect socket
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
    socket.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);