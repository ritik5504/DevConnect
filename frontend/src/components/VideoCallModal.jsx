import React, { useState } from "react";
import { useCall } from "../context/CallContext";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const VideoCallModal = () => {
  const {
    incomingCall,
    activeCall,
    isCalling,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    acceptCall,
    rejectCall,
    endCall
  } = useCall();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRefCallback = React.useCallback((el) => {
    localVideoRef.current = el;
    if (el) {
      if (localStream) {
        if (el.srcObject !== localStream) {
          el.srcObject = localStream;
        }
        el.play().catch((err) => console.error("Error playing local video:", err));
      } else {
        el.srcObject = null;
      }
    }
  }, [localStream, localVideoRef]);

  const remoteVideoRefCallback = React.useCallback((el) => {
    remoteVideoRef.current = el;
    if (el) {
      if (remoteStream) {
        if (el.srcObject !== remoteStream) {
          el.srcObject = remoteStream;
        }
        el.play().catch((err) => console.error("Error playing remote video:", err));
      } else {
        el.srcObject = null;
      }
    }
  }, [remoteStream, remoteVideoRef]);

  // No active call and no incoming call = don't render anything
  if (!incomingCall && !activeCall && !isCalling) return null;

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(16px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* 1. Incoming Call Prompt */}
      {incomingCall && !activeCall && !isCalling && (
        <div className="card glass slide-in" style={{ textAlign: "center", padding: "40px", width: "100%", maxWidth: 360 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", overflow: "hidden", 
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold"
          }}>
            {incomingCall.callerInfo?.profilePic ? (
              <img src={incomingCall.callerInfo.profilePic} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              getInitials(incomingCall.callerInfo?.username)
            )}
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{incomingCall.callerInfo?.username}</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>is calling you...</p>
          
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              onClick={rejectCall}
              style={{
                width: 56, height: 56, borderRadius: "50%", border: "none",
                background: "var(--danger)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="22" y1="2" x2="2" y2="22" />
              </svg>
            </button>
            <button
              onClick={acceptCall}
              style={{
                width: 56, height: 56, borderRadius: "50%", border: "none",
                background: "var(--success)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Call UI */}
      {(activeCall || isCalling) && (
        <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
          
          {/* Remote Video (Full Screen) */}
          <div style={{ flex: 1, backgroundColor: "#000", position: "relative" }}>
             {!remoteStream && isCalling && (
               <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <div className="spinner" style={{ width: 40, height: 40, marginBottom: 16 }} />
                  <p>Calling {activeCall?.user?.username}...</p>
               </div>
             )}
             <video 
               ref={remoteVideoRefCallback} 
               autoPlay 
               playsInline 
               style={{ width: "100%", height: "100%", objectFit: "cover" }} 
             />
          </div>

          {/* Local Video (Floating bottom right) */}
          <div style={{
            position: "absolute",
            bottom: 120, right: 32,
            width: 160, height: 240,
            backgroundColor: "#222",
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
             <video 
               ref={localVideoRefCallback} 
               autoPlay 
               playsInline 
               muted 
               style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} 
             />
          </div>

          {/* Controls */}
          <div style={{
            position: "absolute",
            bottom: 32, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 20,
            padding: "16px 32px",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            borderRadius: 999
          }}>
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: isMuted ? "rgba(255, 255, 255, 0.2)" : "var(--bg-hover)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"></path><path d="M5 10v2a7 7 0 0 0 12 5"></path><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"></path><path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
              )}
            </button>
            
            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: isVideoOff ? "rgba(255, 255, 255, 0.2)" : "var(--bg-hover)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              {isVideoOff ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M21.17 15.83a2 2 0 0 0 .83-1.61V9.8a2 2 0 0 0-2-2h-8.17l-4-4h10.34a2 2 0 0 1 2 2v6.2c0 .4-.1.79-.27 1.13"></path><path d="m16 16-3.83-3.83L6.34 6.34 2 2v20l2-2h12a2 2 0 0 0 1.25-.44"></path></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              )}
            </button>

            {/* End Call */}
            <button
              onClick={endCall}
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none",
                background: "var(--danger)", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
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
