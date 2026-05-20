import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import ChatWindow from "../components/ChatWindow";
import API from "../api/axios";
import socket from "../socket/socket";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const Chat = () => {
  const { user, setOnChatPage, unreadSenders, setUnreadSenders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mark chat page as active so incoming messages don't increment badge
  useEffect(() => {
    setOnChatPage(true);
    return () => setOnChatPage(false);
  }, []);

  // Listen for incoming messages to show red dot on specific user
  useEffect(() => {
    const handleReceive = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      // If message is from someone else and NOT the currently selected user
      if (senderId !== user?._id && senderId !== selectedUser?._id) {
        setUnreadSenders((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [user, selectedUser, setUnreadSenders]);

  // Load only connections (people you follow or who follow you)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/user/connections");
        const allUsers = (res.data.users || []).filter((u) => u._id !== user?._id);
        setUsers(allUsers);

        // Pre-select user from query param
        const userId = searchParams.get("userId");
        if (userId) {
          const found = allUsers.find((u) => u._id === userId);
          if (found) {
            setSelectedUser(found);
          } else {
            // Fetch that specific user even if not in connections yet
            try {
              const userRes = await API.get(`/user/${userId}`);
              setSelectedUser(userRes.data.user);
            } catch {
              /* ignore */
            }
          }
          setUnreadSenders((prev) => {
            const newCounts = { ...prev };
            delete newCounts[userId];
            return newCounts;
          });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Full-width chat layout override */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          height: isMobile ? "calc(100vh - 160px)" : "calc(100vh - 130px)",
          maxWidth: "100%",
          marginTop: isMobile ? -12 : -24,
        }}
      >
        {/* Left: User list */}
        {(!isMobile || !selectedUser) && (
          <div
            style={{
              width: isMobile ? "100%" : 280,
              flexShrink: 0,
              borderRight: isMobile ? "none" : "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 10 }}>
                Messages
              </h2>
              <div style={{ position: "relative" }}>
                <svg
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className="input-field"
                  style={{ paddingLeft: 34, paddingTop: 8, paddingBottom: 8, borderRadius: 10, fontSize: 13 }}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", gap: 10 }}>
                      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: "40%", height: 10 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  {searchQuery ? "No results found" : "Follow someone to start chatting"}
                </div>
              ) : (
                filtered.map((u) => {
                  const hasUnread = unreadSenders[u._id] > 0;
                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        setSelectedUser(u);
                        setUnreadSenders((prev) => {
                          const newCounts = { ...prev };
                          delete newCounts[u._id];
                          return newCounts;
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        cursor: "pointer",
                        background: selectedUser?._id === u._id ? "var(--accent-glow)" : "transparent",
                        borderLeft: `3px solid ${selectedUser?._id === u._id ? "var(--accent)" : "transparent"}`,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedUser?._id !== u._id) e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedUser?._id !== u._id) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, overflow: "hidden", flexShrink: 0 }}>
                        {u.profilePic ? (
                          <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          getInitials(u.username)
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.username}
                        </div>
                        {u.bio && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {u.bio}
                          </div>
                        )}
                      </div>
                      {hasUnread && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--danger)",
                            flexShrink: 0,
                            boxShadow: "0 0 8px var(--danger)",
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right: Chat window */}
        {(!isMobile || selectedUser) && (
          <ChatWindow
            selectedUser={selectedUser}
            onBack={isMobile ? () => setSelectedUser(null) : null}
          />
        )}
      </div>
    </Layout>
  );
};

export default Chat;
