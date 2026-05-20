import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const NotificationDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load real notifications — only for your own posts
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/notification");
        setNotifications((res.data.notifications || []).slice(0, 8));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const typeIcon = (type) => {
    if (type === "like") return (
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
    );
    if (type === "comment") return (
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
    );
    return null;
  };

  return (
    <div
      className="glass"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 340,
        maxHeight: 420,
        borderRadius: 16,
        overflow: "hidden",
        zIndex: 100,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Notifications</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ padding: 32, display: "flex", justifyContent: "center" }}>
            <div className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((n, idx) => {
            const sender = n.sender || n.user;
            return (
              <div
                key={n._id || idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 18px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  borderBottom: "1px solid var(--border)",
                  background: n.read === false ? "rgba(108,99,255,0.05)" : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = n.read === false ? "rgba(108,99,255,0.05)" : "transparent")}
                onClick={() => { onClose?.(); if (sender?._id) navigate(`/profile/${sender._id}`); }}
              >
                {/* Avatar */}
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, overflow: "hidden", flexShrink: 0 }}>
                  {sender?.profilePic
                    ? <img src={sender.profilePic} alt={sender.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : getInitials(sender?.username)
                  }
                </div>

                {/* Type icon */}
                {typeIcon(n.type)}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    <strong>{sender?.username || "Someone"}</strong>{" "}
                    {n.text}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {formatTime(n.createdAt)}
                  </div>
                </div>

                {/* Unread dot */}
                {n.read === false && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
