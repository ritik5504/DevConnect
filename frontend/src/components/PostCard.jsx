import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setLikes(post.likes || []);
  }, [post.likes]);

  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  const isLiked = user && likes.includes(user._id);
  const isOwner = user && post.user?._id === user._id;

  const handleLike = async () => {
    if (likeLoading) return;
    // Optimistic update
    setLikes((prev) =>
      isLiked ? prev.filter((id) => id !== user._id) : [...prev, user._id]
    );
    try {
      setLikeLoading(true);
      const res = await API.put(`/post/like/${post._id}`);
      setLikes(res.data.likes || likes);
    } catch {
      // Revert
      setLikes((prev) =>
        isLiked ? [...prev, user._id] : prev.filter((id) => id !== user._id)
      );
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commentLoading) return;
    try {
      setCommentLoading(true);
      const res = await API.post(`/post/comment/${post._id}`, { text: commentText });
      setComments(res.data.comments || [...comments, { text: commentText, user: { username: user.username, _id: user._id }, createdAt: new Date() }]);
      setCommentText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Comment failed");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      setDeleteLoading(true);
      await API.delete(`/post/${post._id}`);
      toast.success("Post deleted");
      onDelete?.(post._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const postUser = post.user || {};

  return (
    <div className="card fade-in" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div
          className="avatar"
          style={{ width: 42, height: 42, fontSize: 15, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}
          onClick={() => postUser._id && navigate(`/profile/${postUser._id}`)}
        >
          {postUser.profilePic ? (
            <img src={postUser.profilePic} alt={postUser.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials(postUser.username)
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", cursor: "pointer" }}
              onClick={() => postUser._id && navigate(`/profile/${postUser._id}`)}
            >
              {postUser.username || "Unknown"}
            </span>
            {postUser.skills?.slice(0, 2).map((s) => (
              <span key={s} className="tag" style={{ fontSize: 10, padding: "2px 8px" }}>{s}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {formatTime(post.createdAt)}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-primary)", marginBottom: post.image ? 12 : 16, whiteSpace: "pre-wrap" }}>
        {post.content}
      </p>

      {post.image && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden" }}>
          <img src={post.image} alt="Post attachment" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Actions */}
      <div className="divider" style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleLike}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 10,
            border: "1px solid " + (isLiked ? "rgba(239,68,68,0.3)" : "var(--border)"),
            background: isLiked ? "rgba(239,68,68,0.1)" : "transparent",
            color: isLiked ? "#ef4444" : "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likes.length}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: showComments ? "var(--bg-hover)" : "transparent",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {comments.length}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ marginTop: 14 }} className="fade-in">
          {comments.length > 0 && (
            <div style={{ marginBottom: 12, maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {comments.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "8px 12px",
                    background: "var(--bg-hover)",
                    borderRadius: 10,
                  }}
                >
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>
                    {getInitials(c.user?.username)}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-primary)" }}>
                      {c.user?.username || "User"}
                    </span>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, textAlign: "center" }}>
              No comments yet. Be the first!
            </p>
          )}
          <form onSubmit={handleComment} style={{ display: "flex", gap: 8 }}>
            <input
              className="input-field"
              style={{ borderRadius: 10, fontSize: 13, padding: "8px 14px" }}
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "var(--accent)",
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {commentLoading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
