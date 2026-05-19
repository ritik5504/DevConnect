import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", formData);
      const token = res.data.accessToken;
      localStorage.setItem("token", token);
      // Fetch user data
      const meRes = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      login(token, meRes.data.user);
      toast.success("Welcome back! 🎉");
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="DevConnect"
            style={{
              height: 140,
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(212,175,55,0.05)",
            }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Sign in to your DevConnect account
          </p>
        </div>

        {/* Form */}
        <div className="card" style={{ borderRadius: 20, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                className="input-field"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                placeholder="••••••••"
                className="input-field"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;