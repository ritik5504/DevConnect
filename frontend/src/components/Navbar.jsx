import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = ({ onMenuClick, isMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await API.get(
          `/user/search?query=${encodeURIComponent(searchQuery)}`
        );
        setSearchResults(res.data.users || []);
        setSearchOpen(true);
      } catch {
        /* ignore */
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

  return (
    <nav
      className="glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 12px" : "0 24px",
        height: 64,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "1px solid var(--border)",
        borderRadius: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <Link
          to="/home"
          style={{
            display: isMobile && searchQuery ? "none" : "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: "white",
            }}
          >
            D
          </div>
          {!isMobile && (
            <span
              style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}
            >
              Dev<span className="gradient-text">Connect</span>
            </span>
          )}
        </Link>
      </div>

      {/* Search */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: 400, margin: "0 24px" }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="input-field"
            style={{ paddingLeft: 40, paddingRight: 12, borderRadius: 999 }}
            placeholder="Search developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
          />
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div
            className="glass"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              borderRadius: 16,
              overflow: "hidden",
              zIndex: 100,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            {searchLoading ? (
              <div
                style={{
                  padding: 20,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div className="spinner" />
              </div>
            ) : searchResults.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                No users found
              </div>
            ) : (
              searchResults.slice(0, 5).map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    navigate(`/profile/${u._id}`);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    className="avatar"
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 13,
                      overflow: "hidden",
                    }}
                  >
                    {u.profilePic ? (
                      <img
                        src={u.profilePic}
                        alt={u.username}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitials(u.username)
                    )}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}
                    >
                      {u.username}
                    </div>
                    {u.skills?.length > 0 && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {u.skills.slice(0, 3).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            id="notif-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: notifOpen ? "var(--bg-hover)" : "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            id="profile-dropdown-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px 6px 6px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: profileOpen ? "var(--bg-hover)" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              className="avatar"
              style={{
                width: 30,
                height: 30,
                fontSize: 12,
                overflow: "hidden",
              }}
            >
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials(user?.username)
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {user?.username || "User"}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div
              className="glass"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 200,
                borderRadius: 14,
                overflow: "hidden",
                zIndex: 100,
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              {[
                { label: "My Profile", to: `/profile/${user?._id}` },
                { label: "Edit Profile", to: "/edit-profile" },
                { label: "Settings", to: "/edit-profile" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {item.label}
                </Link>
              ))}
              <div className="divider" style={{ margin: "4px 0" }} />
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: 14,
                  color: "var(--danger)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;