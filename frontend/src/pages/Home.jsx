import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import API from "../api/axios";

const Home = () => {
  const [feedType, setFeedType] = useState("all"); // 'all' or 'following'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum = 1, type = feedType) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      const endpoint = type === "following" ? "/post/feed" : "/post";
      const res = await API.get(`${endpoint}?page=${pageNum}`);
      
      const fetched = res.data.posts || [];
      if (pageNum === 1) {
        setPosts(fetched);
      } else {
        setPosts((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length >= 10);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1, feedType);
  }, [feedType]);

  const handlePostCreated = (newPost) => {
    if (feedType === "all") {
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Feed Toggle */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <button
            onClick={() => setFeedType("all")}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: feedType === "all" ? "var(--accent-glow)" : "transparent",
              color: feedType === "all" ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${feedType === "all" ? "var(--accent)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Global Feed
          </button>
          <button
            onClick={() => setFeedType("following")}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: feedType === "following" ? "var(--accent-glow)" : "transparent",
              color: feedType === "following" ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${feedType === "following" ? "var(--accent)" : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Following
          </button>
        </div>

        {/* Create post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Feed */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: "40%", height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: "20%", height: 12 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: "100%", height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "80%", height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: "60%", height: 14 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
              No posts yet
            </h3>
            <p style={{ fontSize: 14 }}>
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
            ))}

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 16, marginBottom: 24 }}>
                <button
                  id="load-more-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-secondary"
                  style={{ padding: "12px 32px" }}
                >
                  {loadingMore ? (
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  ) : (
                    "Load more posts"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Home;