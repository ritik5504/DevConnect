import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import API from "../api/axios";
import toast from "react-hot-toast";

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: user?.bio || "",
    skills: user?.skills?.join(", ") || "",
    profilePic: user?.profilePic || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        bio: form.bio.trim(),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        profilePic: form.profilePic.trim(),
      };
      const res = await API.put("/user/update", payload);
      setUser(res.data.user || res.data);
      toast.success("Profile updated! 🎉");
      navigate(`/profile/${user._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <Layout>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>
            Edit Profile
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
            Update your profile information
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Avatar preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
            <div
              className="avatar"
              style={{ width: 72, height: 72, fontSize: 24, overflow: "hidden" }}
            >
              {form.profilePic ? (
                <img src={form.profilePic} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => (e.target.style.display = "none")} />
              ) : (
                getInitials(user?.username)
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{user?.username}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Profile Pic URL */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Profile Picture URL
              </label>
              <input
                id="edit-profile-pic"
                type="url"
                name="profilePic"
                placeholder="https://example.com/photo.jpg"
                className="input-field"
                value={form.profilePic}
                onChange={handleChange}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Enter a direct URL to your profile image
              </p>
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Bio
              </label>
              <textarea
                id="edit-bio"
                name="bio"
                placeholder="Tell the community about yourself..."
                className="input-field"
                rows={4}
                style={{ resize: "vertical", lineHeight: 1.6 }}
                value={form.bio}
                onChange={handleChange}
              />
            </div>

            {/* Skills */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Skills
              </label>
              <input
                id="edit-skills"
                type="text"
                name="skills"
                placeholder="React, Node.js, Python, TypeScript..."
                className="input-field"
                value={form.skills}
                onChange={handleChange}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Separate skills with commas
              </p>

              {/* Skill preview */}
              {form.skills && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {form.skills.split(",").filter((s) => s.trim()).map((s, i) => (
                    <span key={i} className="tag">{s.trim()}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                id="edit-save-btn"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;
