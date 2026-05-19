import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const SearchBar = ({ onResults, placeholder = "Search developers..." }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      onResults?.([], "");  // pass empty string so parent knows query was cleared
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await API.get(`/user/search?query=${encodeURIComponent(query)}`);
        const users = res.data.users || [];
        setResults(users);
        onResults?.(users, query);  // pass query so parent knows search is active
        setOpen(true);
      } catch {
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        {loading ? (
          <div className="spinner" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, borderWidth: 2 }} />
        ) : (
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        )}
        <input
          id="search-input"
          className="input-field"
          style={{ paddingLeft: 42 }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="glass" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, borderRadius: 14, overflow: "hidden", zIndex: 50, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
          {results.slice(0, 6).map((u) => (
            <div
              key={u._id}
              onClick={() => { navigate(`/profile/${u._id}`); setOpen(false); setQuery(""); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 12, overflow: "hidden", flexShrink: 0 }}>
                {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(u.username)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{u.username}</div>
                {Array.isArray(u.skills) && u.skills.length > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.skills.slice(0, 3).join(" · ")}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
