import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    label: "Home",
    to: "/home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Search",
    to: "/search",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: "Chat",
    to: "/chat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    to: "/notifications",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Profile",
    to: null, // dynamic
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const BottomNav = () => {
  const { user, unreadMessages, unreadNotifications } = useAuth();

  const getTo = (item) => {
    if (item.label === "Profile" && user) return `/profile/${user._id}`;
    return item.to;
  };

  return (
    <div
      className="glass"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        borderTop: "1px solid var(--border)",
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        zIndex: 100,
        paddingBottom: "calc(env(safe-area-inset-bottom) * 0.5)",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.5)",
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={getTo(item)}
          style={({ isActive }) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "11px",
            fontWeight: 500,
            padding: "8px 0",
            flex: 1,
            transition: "color 0.2s ease",
            position: "relative",
          })}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
            {item.icon}
            
            {item.label === "Chat" && unreadMessages > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--danger)",
                  border: "1.5px solid var(--bg-card)",
                  boxShadow: "0 0 6px var(--danger)",
                }}
              />
            )}
            
            {item.label === "Notifications" && unreadNotifications > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--danger)",
                  border: "1.5px solid var(--bg-card)",
                  boxShadow: "0 0 6px var(--danger)",
                }}
              />
            )}
          </div>
          <span style={{ fontSize: "10px" }}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
