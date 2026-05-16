import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    try {
      setLoading(true);
      await API.post("/auth/verify-otp", { email, otp: code });
      toast.success("Email verified! You can now login 🎉");
      localStorage.removeItem("email");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await API.post("/auth/register", { email, resend: true });
      toast.success("OTP resent!");
    } catch {
      toast.error("Could not resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "white",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(108,99,255,0.3)",
            }}
          >
            ✉
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Verify your email
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 280, margin: "0 auto" }}>
            We sent a 6-digit code to{" "}
            <strong style={{ color: "var(--text-secondary)" }}>{email}</strong>
          </p>
        </div>

        <div className="card" style={{ borderRadius: 20, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* OTP inputs */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    background: "var(--bg-hover)",
                    border: `1px solid ${digit ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 12,
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "all 0.2s",
                    boxShadow: digit ? "0 0 0 3px var(--accent-glow)" : "none",
                  }}
                />
              ))}
            </div>

            <button
              id="otp-submit-btn"
              type="submit"
              className="btn-primary"
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;