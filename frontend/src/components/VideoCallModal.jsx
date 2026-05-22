import React, { useState, useCallback, useEffect } from "react";
import { useCall } from "../context/CallContext";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const VideoCallModal = () => {
  const {
    incomingCall,
    activeCall,
    isCalling,
    hasRemoteVideo,
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    remoteStreamRef,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  const [isMuted,   setIsMuted]   = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ── Callback ref for the LOCAL <video> element ───────────────────────────────
  // This fires whenever React mounts or unmounts the DOM node.
  const localVideoCallbackRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      if (el.srcObject !== localStreamRef.current) {
        el.srcObject = localStreamRef.current;
      }
      el.play().catch((e) => {
        if (e.name !== "AbortError") console.warn("[VideoCallModal] local play():", e.message);
      });
    }
  }, []); // stable – intentionally no deps

  // ── Callback ref for the REMOTE <video> element ──────────────────────────────
  const remoteVideoCallbackRef = useCallback((el) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      if (el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
      }
      el.play().catch((e) => {
        if (e.name !== "AbortError") console.warn("[VideoCallModal] remote play():", e.message);
      });
    }
  }, []); // stable – intentionally no deps

  // ── If hasRemoteVideo turns true AFTER the <video> already mounted, push stream ─
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || !remoteStreamRef.current) return;
    if (el.srcObject !== remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
    el.play().catch((e) => {
      if (e.name !== "AbortError") console.warn("[VideoCallModal] remote play() effect:", e.message);
    });
  }, [hasRemoteVideo]);

  // ── Nothing to show ──────────────────────────────────────────────────────────
  if (!incomingCall && !activeCall && !isCalling) return null;

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── 1. Incoming call ring UI ─────────────────────────────────────────── */}
      {incomingCall && !activeCall && !isCalling && (
        <div
          className="card glass"
          style={{ textAlign: "center", padding: "40px 32px", maxWidth: 360, width: "90%" }}
        >
          <div
            style={{
              width: 80, height: 80, borderRadius: "50%",
              margin: "0 auto 20px", overflow: "hidden",
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: "bold",
            }}
          >
            {incomingCall.callerInfo?.profilePic ? (
              <img
                src={incomingCall.callerInfo.profilePic}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getInitials(incomingCall.callerInfo?.username)
            )}
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {incomingCall.callerInfo?.username}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>is calling you...</p>

          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            {/* Reject */}
            <button
              onClick={rejectCall}
              style={{
                width: 60, height: 60, borderRadius: "50%", border: "none",
                background: "var(--danger)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="22" y1="2" x2="2" y2="22" />
              </svg>
            </button>
            {/* Accept */}
            <button
              onClick={acceptCall}
              style={{
                width: 60, height: 60, borderRadius: "50%", border: "none",
                background: "var(--success)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Active call UI ────────────────────────────────────────────────── */}
      {(activeCall || isCalling) && (
        <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>

          {/* Remote video — full screen */}
          <div style={{ flex: 1, backgroundColor: "#000", position: "relative", overflow: "hidden" }}>

            {/* Waiting overlay (no remote stream yet) */}
            {!hasRemoteVideo && (
              <div
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  color: "white", zIndex: 2,
                }}
              >
                <div className="spinner" style={{ width: 44, height: 44, marginBottom: 16 }} />
                <p style={{ fontSize: 16 }}>
                  {activeCall?.isCaller
                    ? `Calling ${activeCall.user?.username}…`
                    : "Connecting…"}
                </p>
              </div>
            )}

            {/* The actual remote video element */}
            <video
              ref={remoteVideoCallbackRef}
              autoPlay
              playsInline
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          {/* Local video — floating thumbnail */}
          <div
            style={{
              position: "absolute",
              bottom: 112, right: 24,
              width: 140, height: 200,
              backgroundColor: "#111",
              borderRadius: 14,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              zIndex: 10,
            }}
          >
            <video
              ref={localVideoCallbackRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
                display: "block",
              }}
            />
          </div>

          {/* Controls bar */}
          <div
            style={{
              position: "absolute",
              bottom: 28, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 16,
              padding: "14px 28px",
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(12px)",
              borderRadius: 999,
              zIndex: 10,
            }}
          >
            {/* Mute */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: isMuted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              )}
            </button>

            {/* Camera toggle */}
            <button
              onClick={toggleVideo}
              title={isVideoOff ? "Turn camera on" : "Turn camera off"}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: isVideoOff ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {isVideoOff ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M21.17 15.83a2 2 0 0 0 .83-1.61V9.8a2 2 0 0 0-2-2h-8.17l-4-4h10.34a2 2 0 0 1 2 2v6.2c0 .4-.1.79-.27 1.13"/><path d="m16 16-3.83-3.83L6.34 6.34 2 2v20l2-2h12a2 2 0 0 0 1.25-.44"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              )}
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              title="End call"
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: "var(--danger)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="22" y1="2" x2="2" y2="22" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
