import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const UserCard = ({ user: targetUser }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(
    targetUser.followers?.includes(currentUser?._id)
  );
  const [loading, setLoading] = useState(false);

  if (targetUser._id === currentUser?._id) return null;

  const handleFollow = async () => {
    try {
      setLoading(true);
      if (following) {
        await API.put(`/user/unfollow/${targetUser._id}`);
        setFollowing(false);
        toast.success(`Unfollowed ${targetUser.username}`);
      } else {
        await API.put(`/user/follow/${targetUser._id}`);
        setFollowing(true);
        toast.success(`Following ${targetUser.username}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
      <div
        className="avatar"
        style={{ width: 48, height: 48, fontSize: 16, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}
        onClick={() => navigate(`/profile/${targetUser._id}`)}
      >
        {targetUser.profilePic ? (
          <img src={targetUser.profilePic} alt={targetUser.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          getInitials(targetUser.username)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", cursor: "pointer", marginBottom: 2 }}
          onClick={() => navigate(`/profile/${targetUser._id}`)}
        >
          {targetUser.username}
        </div>
        {targetUser.bio && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {targetUser.bio}
          </div>
        )}
        {targetUser.skills?.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {targetUser.skills.slice(0, 3).map((s) => (
              <span key={s} className="tag" style={{ fontSize: 10, padding: "2px 8px" }}>{s}</span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={following ? "btn-secondary" : "btn-primary"}
        style={{ width: "auto", padding: "8px 16px", fontSize: 13, flexShrink: 0 }}
      >
        {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : following ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
};

const UserList = ({ users, emptyMessage = "No users found" }) => {
  if (!users || users.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <p style={{ fontSize: 14 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {users.map((u) => (
        <UserCard key={u._id} user={u} />
      ))}
    </div>
  );
};

export default UserList;
