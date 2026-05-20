import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import socket from "../socket/socket";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { clearUnreadNotifications } = useAuth();

  // Clear badge when page is opened and mark all as read on server
  useEffect(() => {
    clearUnreadNotifications();
    API.put("/notification/read").catch(() => {});
  }, []);

  // Load notifications from real API — only notifications for the current user
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get("/notification");
        setNotifications(res.data.notifications || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Listen for new real-time notifications (like/comment on your post)
  useEffect(() => {
    const handleNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      clearUnreadNotifications();
    };
    socket.on("newNotification", handleNewNotif);
    return () => socket.off("newNotification", handleNewNotif);
  }, []);

  const typeIcon = (type) => {
    if (type === "like") return (
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
    );
    if (type === "comment") return (
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
    );
    return null;
  };

  const getSenderAvatar = (sender) => {
    if (sender?.profilePic) {
      return <img src={sender.profilePic} alt={sender.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
    }
    return getInitials(sender?.username);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Likes and comments on your posts
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: "70%", height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: "30%", height: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
                Quiet for now
              </h3>
              <p style={{ fontSize: 14 }}>
                When someone likes or comments on your post, it'll show up here.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n, idx) => {
                const sender = n.sender || n.user;
                return (
                  <div
                    key={n._id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 20px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      borderBottom: "1px solid var(--border)",
                      background: n.read === false ? "rgba(108,99,255,0.04)" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read === false ? "rgba(108,99,255,0.04)" : "transparent")}
                    onClick={() => {
                      if (sender?._id) navigate(`/profile/${sender._id}`);
                    }}
                  >
                    {/* Sender avatar */}
                    <div
                      className="avatar"
                      style={{ width: 40, height: 40, fontSize: 14, overflow: "hidden", flexShrink: 0, position: "relative" }}
                    >
                      {getSenderAvatar(sender)}
                    </div>

                    {/* Type icon badge */}
                    <div style={{ flexShrink: 0, marginLeft: -16, marginTop: 20 }}>
                      {typeIcon(n.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
                        <strong style={{ fontWeight: 700 }}>{sender?.username || "Someone"}</strong>{" "}
                        {n.text}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        {formatTime(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {n.read === false && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, boxShadow: "0 0 6px var(--accent)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
