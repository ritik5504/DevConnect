import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import API from "../api/axios";

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Using posts as a proxy for activity feed since there's no dedicated notifications endpoint in the schema
        const res = await API.get("/post");
        const posts = res.data.posts || [];
        
        const notifs = [];
        posts.slice(0, 20).forEach((post) => {
          post.comments?.forEach((c) => {
            notifs.push({
              _id: `comment-${post._id}-${c._id || Math.random()}`,
              type: "comment",
              user: c.user,
              postId: post._id,
              text: `commented on your post: "${c.text?.slice(0, 60)}${c.text?.length > 60 ? "..." : ""}"`,
              createdAt: c.createdAt || post.createdAt,
            });
          });
          
          post.likes?.forEach((likeId) => {
            // In a real app, you'd fetch the user info for the like
            // Here we just use a generic "Someone" if we don't have user info
            notifs.push({
              _id: `like-${post._id}-${likeId}`,
              type: "like",
              user: { _id: likeId, username: "Someone" },
              postId: post._id,
              text: "liked your post",
              createdAt: post.createdAt,
            });
          });
        });
        
        // Sort by date
        notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(notifs);
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
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
    );
    if (type === "comment") return (
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(108,99,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
    );
    return (
      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Stay updated with your latest activity
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
                When you get likes or comments, they'll show up here.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => {
                    if (n.postId) navigate(`/home`); // Scroll to post would be better
                    else if (n.user?._id) navigate(`/profile/${n.user._id}`);
                  }}
                >
                  {typeIcon(n.type)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 700 }}>{n.user?.username || "Someone"}</strong>{" "}
                      {n.text}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
