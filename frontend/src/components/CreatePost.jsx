import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    try {
      setLoading(true);
      const res = await API.post("/post", { content, image });
      onPostCreated?.(res.data.post);
      setContent("");
      setImage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          
          {/* Image Preview */}
          {image && (
            <div style={{ position: "relative", marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
              <img src={image} alt="Preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 8px",
                  borderRadius: 8,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-glow)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Photo</span>
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{ display: "none" }} 
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {content.length} characters
              </span>
            </div>
            <button
              id="create-post-btn"
              type="submit"
              disabled={loading || (!content.trim() && !image)}
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
