import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      setLoading(true);
      const res = await API.post("/post", { content });
      onPostCreated?.(res.data.post);
      setContent("");
      toast.success("Post created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          className="avatar"
          style={{ width: 40, height: 40, fontSize: 14, overflow: "hidden", flexShrink: 0 }}
        >
          {user?.profilePic ? (
            <img src={user.profilePic} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials(user?.username)
          )}
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1 }}>
          <textarea
            id="create-post-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share with the dev community..."
            rows={3}
            className="input-field"
            style={{
              resize: "none",
              borderRadius: 12,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {content.length} characters
            </span>
            <button
              id="create-post-btn"
              type="submit"
              disabled={loading || !content.trim()}
              className="btn-primary"
              style={{ width: "auto", padding: "10px 24px" }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
