import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import API from "../api/axios";
import toast from "react-hot-toast";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const profileId = id || currentUser?._id;
  const isOwn = profileId === currentUser?._id;

  useEffect(() => {
    const load = async () => {
      if (!profileId) return;
      try {
        setLoading(true);
        const res = await API.get(`/user/${profileId}`);
        const u = res.data.user;
        setProfile(u);
        setFollowing(u.followers?.includes(currentUser?._id));
      } catch {
        toast.error("User not found");
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileId]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPostsLoading(true);
        const res = await API.get("/post");
        const allPosts = res.data.posts || [];
        setPosts(allPosts.filter((p) => p.user?._id === profileId || p.user === profileId));
      } catch {
        /* ignore */
      } finally {
        setPostsLoading(false);
      }
    };
    if (profileId) loadPosts();
  }, [profileId]);

  const handleFollow = async () => {
    if (followLoading) return;
    const prevFollowing = following;
    const prevFollowers = [...(profile.followers || [])];

    // Optimistic update
    setFollowing(!prevFollowing);
    if (prevFollowing) {
      setProfile((p) => ({ ...p, followers: p.followers.filter((f) => f !== currentUser._id) }));
    } else {
      setProfile((p) => ({ ...p, followers: [...(p.followers || []), currentUser._id] }));
    }

    try {
      setFollowLoading(true);
      if (prevFollowing) {
        await API.put(`/user/unfollow/${profileId}`);
        toast.success("Unfollowed");
      } else {
        await API.put(`/user/follow/${profileId}`);
        toast.success("Following!");
      }
    } catch (err) {
      // Revert on error
      setFollowing(prevFollowing);
      setProfile((p) => ({ ...p, followers: prevFollowers }));
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: "40%", height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "80%", height: 14 }} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Profile card */}
        <div className="card" style={{ marginBottom: 20, padding: 28 }}>
          {/* Cover gradient */}
          <div
            style={{
              height: 100,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(108,99,255,0.3) 0%, rgba(167,139,250,0.15) 100%)",
              marginBottom: -50,
              marginLeft: -8,
              marginRight: -8,
            }}
          />

          {/* Avatar + actions */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
            <div
              className="avatar"
              style={{
                width: 96,
                height: 96,
                fontSize: 32,
                overflow: "hidden",
                border: "4px solid var(--bg-card)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {profile.profilePic ? (
                <img src={profile.profilePic} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getInitials(profile.username)
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {isOwn ? (
                <button
                  id="edit-profile-btn"
                  onClick={() => navigate("/edit-profile")}
                  className="btn-secondary"
                  style={{ padding: "8px 18px", fontSize: 13 }}
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    id="follow-btn"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={following ? "btn-secondary" : "btn-primary"}
                    style={{ padding: "8px 18px", fontSize: 13, width: "auto" }}
                  >
                    {followLoading ? (
                      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : following ? "Unfollow" : "Follow"}
                  </button>
                  <button
                    id="message-btn"
                    onClick={() => navigate(`/chat?userId=${profileId}`)}
                    className="btn-secondary"
                    style={{ padding: "8px 18px", fontSize: 13 }}
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              {profile.username}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 10 }}>
              {profile.email}
            </p>
            {profile.bio && (
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                {profile.bio}
              </p>
            )}

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {profile.skills.map((s) => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
              {[
                { label: "Posts", value: posts.length },
                { label: "Followers", value: profile.followers?.length || 0 },
                { label: "Following", value: profile.following?.length || 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
          Posts
        </h2>

        {postsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[1, 2].map((i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ width: "100%", height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: "70%", height: 14 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: 14 }}>
            {isOwn ? "You haven't posted anything yet." : `${profile.username} hasn't posted yet.`}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={(id) => setPosts((p) => p.filter((x) => x._id !== id))} />
          ))
        )}
      </div>
    </Layout>
  );
};

export default Profile;