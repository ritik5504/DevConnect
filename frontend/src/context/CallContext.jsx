import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import socket from "../socket/socket";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import API from "../api/axios";

const CallContext = createContext();

// ─── ICE / TURN config ────────────────────────────────────────────────────────
// Multiple TURN servers so if one is down, others relay the traffic.
// freeturn.net is a known reliable free public TURN relay.
const RTC_CONFIG = {
  iceServers: [
    // STUN – discover public IPs
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },

    // TURN #1 – freeturn.net (reliable free public relay)
    {
      urls: "turn:freeturn.net:3478",
      username: "free",
      credential: "free",
    },
    {
      urls: "turns:freeturn.net:5349",
      username: "free",
      credential: "free",
    },

    // TURN #2 – openrelay.metered.ca (backup)
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turns:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },

    // TURN #3 – numb.viagenie.ca (additional backup)
    {
      urls: "turn:numb.viagenie.ca",
      username: "webrtc@live.com",
      credential: "muazkh",
    },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();

  // ── UI state (drives rendering only) ────────────────────────────────────────
  const [incomingCall, setIncomingCall]   = useState(null);
  const [activeCall,   setActiveCall]     = useState(null);
  const [isCalling,    setIsCalling]      = useState(false);
  // hasRemoteVideo: true once the first remote track arrives
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // ── Stable refs – never stale inside callbacks ───────────────────────────────
  const pcRef             = useRef(null);   // RTCPeerConnection
  const localStreamRef    = useRef(null);   // local MediaStream
  const remoteStreamRef   = useRef(null);   // remote MediaStream
  const candidateQueue    = useRef([]);     // ICE queue before remote desc
  const incomingCallRef   = useRef(null);   // mirror of incomingCall state
  const activeCallRef     = useRef(null);   // mirror of activeCall state
  const isCallingRef      = useRef(false);  // mirror of isCalling state
  const remoteUserIdRef   = useRef(null);   // who we are connected to

  // ── Video element refs (set by callback-refs in VideoCallModal) ──────────────
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  // Keep state mirrors in refs so socket callbacks always see fresh values
  useEffect(() => { activeCallRef.current  = activeCall;  }, [activeCall]);
  useEffect(() => { isCallingRef.current   = isCalling;   }, [isCalling]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // ── Helper: play a video element safely ─────────────────────────────────────
  const safePlay = (el) => {
    if (!el) return;
    el.play().catch((err) => {
      if (err.name !== "AbortError") console.warn("[WebRTC] play() error:", err.name, err.message);
    });
  };

  // ── Helper: attach stream to a video element ────────────────────────────────
  const attachStream = (el, stream) => {
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    safePlay(el);
  };

  // ── Process queued ICE candidates ───────────────────────────────────────────
  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    console.log(`[WebRTC] Flushing ${candidateQueue.current.length} queued ICE candidates`);
    while (candidateQueue.current.length > 0) {
      const c = candidateQueue.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        console.log("[WebRTC] ice-candidate applied from queue");
      } catch (e) {
        console.warn("[WebRTC] queued ice-candidate error:", e.message);
      }
    }
  }, []);

  // ── Get local camera+mic stream ──────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      // Attach immediately if the video element already exists in DOM
      attachStream(localVideoRef.current, stream);
      console.log("[WebRTC] local stream ready");
      return stream;
    } catch (err) {
      console.error("[WebRTC] getUserMedia failed:", err);
      toast.error("Camera/microphone access denied");
      return null;
    }
  }, []);

  // ── Fetch ICE servers from backend (best) or fall back to hardcoded ──────────
  const fetchIceServers = useCallback(async () => {
    try {
      const res = await API.get("/call/ice-servers");
      const servers = res.data.iceServers;
      console.log("[WebRTC] ICE servers fetched from backend:", servers.length, "entries");
      return { iceServers: servers, iceCandidatePoolSize: 10 };
    } catch (err) {
      console.warn("[WebRTC] Failed to fetch ICE servers from backend, using fallback:", err.message);
      return RTC_CONFIG;
    }
  }, []);

  // ── Build RTCPeerConnection ──────────────────────────────────────────────────
  const buildPeerConnection = useCallback((remoteUserId, rtcConfig) => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    console.log("[WebRTC] Creating RTCPeerConnection for:", remoteUserId);
    const pc = new RTCPeerConnection(rtcConfig || RTC_CONFIG);
    pcRef.current = pc;
    remoteUserIdRef.current = remoteUserId;

    // Add all local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
        console.log("[WebRTC] addTrack:", track.kind);
      });
    }

    // ── ontrack: remote side sends audio/video ──────────────────────────────
    pc.ontrack = (event) => {
      console.log("[WebRTC] remote stream received - track:", event.track.kind);

      // Prefer the stream that comes bundled with the track
      const incomingStream = event.streams && event.streams[0];

      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
      } else {
        // Fallback: build a MediaStream manually
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        const alreadyAdded = remoteStreamRef.current
          .getTracks()
          .some((t) => t.id === event.track.id);
        if (!alreadyAdded) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      // Attach to DOM immediately (don't wait for React re-render)
      attachStream(remoteVideoRef.current, remoteStreamRef.current);
      setHasRemoteVideo(true);
    };

    // ── onicecandidate: send our ICE candidates to the peer ─────────────────
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] ice sent:", event.candidate.type, event.candidate.protocol);
        socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
      } else {
        console.log("[WebRTC] ICE gathering complete");
      }
    };

    pc.onicecandidateerror = (event) => {
      // errorCode 701 = STUN/TURN unreachable (normal for blocked servers, not fatal)
      if (event.errorCode !== 701) {
        console.warn("[WebRTC] ICE candidate error:", event.errorCode, event.errorText, event.url);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("[WebRTC] iceGatheringState:", pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] iceConnectionState:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE failed — attempting ICE restart...");
        // restartIce() triggers a new offer/answer with fresh ICE candidates
        pc.restartIce();
      }
      if (pc.iceConnectionState === "disconnected") {
        console.warn("[WebRTC] ICE disconnected — may recover automatically");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connectionState:", pc.connectionState);
      if (pc.connectionState === "failed") {
        console.warn("[WebRTC] Connection failed, cleaning up");
        cleanupCall();
      }
    };

    return pc;
  }, []);

  // ── Cleanup everything ───────────────────────────────────────────────────────
  const cleanupCall = useCallback(() => {
    console.log("[WebRTC] cleanup executed");

    // 1. Close peer connection
    if (pcRef.current) {
      pcRef.current.ontrack            = null;
      pcRef.current.onicecandidate     = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onicegatheringstatechange  = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // 2. Stop local camera / microphone
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        t.stop();
        console.log("[WebRTC] stopped local track:", t.kind);
      });
      localStreamRef.current = null;
    }

    // 3. Stop remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }

    // 4. Black out video elements and release browser camera lock
    if (localVideoRef.current)  { localVideoRef.current.srcObject  = null; }
    if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; }

    // 5. Reset all state
    candidateQueue.current   = [];
    remoteUserIdRef.current  = null;
    setActiveCall(null);
    setIncomingCall(null);
    setIsCalling(false);
    setHasRemoteVideo(false);
  }, []);

  // ── Socket listeners (registered once per user, stay for lifetime) ──────────
  useEffect(() => {
    if (!user) return;
    console.log("[WebRTC] socket connected - registering call listeners for", user._id);

    // ── Incoming call (we are the callee) ──────────────────────────────────
    const onIncomingCall = ({ signal, from, callerInfo }) => {
      console.log("[WebRTC] offer received from:", from);
      if (activeCallRef.current || isCallingRef.current) {
        console.warn("[WebRTC] already in call, ignoring incoming call");
        return;
      }
      setIncomingCall({ signal, from, callerInfo });
    };

    // ── Caller receives the answer ─────────────────────────────────────────
    const onCallAccepted = async (signal) => {
      console.log("[WebRTC] answer received");
      const pc = pcRef.current;
      if (!pc) { console.warn("[WebRTC] no pc on callAccepted"); return; }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        console.log("[WebRTC] remote description set (answer)");
        await flushCandidates();
      } catch (err) {
        console.error("[WebRTC] setRemoteDescription (answer) error:", err);
      }
    };

    // ── ICE candidate from remote peer ─────────────────────────────────────
    const onIceCandidate = async (candidate) => {
      console.log("[WebRTC] ice received");
      const pc = pcRef.current;
      if (!pc) { console.warn("[WebRTC] no pc for ice candidate"); return; }

      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[WebRTC] ice-candidate applied immediately");
        } catch (e) {
          console.warn("[WebRTC] addIceCandidate error:", e.message);
        }
      } else {
        console.log("[WebRTC] queuing ice-candidate (no remote desc yet)");
        candidateQueue.current.push(candidate);
      }
    };

    // ── Remote peer ended the call ──────────────────────────────────────────
    const onEndCall = () => {
      console.log("[WebRTC] call ended (remote)");
      cleanupCall();
      toast("Call ended", { icon: "📞" });
    };

    socket.on("incomingCall",  onIncomingCall);
    socket.on("callAccepted",  onCallAccepted);
    socket.on("iceCandidate",  onIceCandidate);
    socket.on("endCall",       onEndCall);
    // Also listen to alternate event names the backend emits
    socket.on("incoming-call", onIncomingCall);
    socket.on("answer-call",   onCallAccepted);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("call-ended",    onEndCall);

    return () => {
      socket.off("incomingCall",  onIncomingCall);
      socket.off("callAccepted",  onCallAccepted);
      socket.off("iceCandidate",  onIceCandidate);
      socket.off("endCall",       onEndCall);
      socket.off("incoming-call", onIncomingCall);
      socket.off("answer-call",   onCallAccepted);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("call-ended",    onEndCall);
    };
  }, [user, flushCandidates, cleanupCall]);

  // ── Unmount cleanup ──────────────────────────────────────────────────────────
  useEffect(() => () => cleanupCall(), []);

  // ── initiateCall (we are the caller) ────────────────────────────────────────
  const initiateCall = useCallback(async (userToCall) => {
    console.log("[WebRTC] initiating call to:", userToCall.username);
    setIsCalling(true);

    // Fetch fresh ICE servers AND local stream in parallel
    const [rtcConfig, stream] = await Promise.all([
      fetchIceServers(),
      getLocalStream(),
    ]);

    if (!stream) { setIsCalling(false); return; }

    setActiveCall({ user: userToCall, isCaller: true });

    const pc = buildPeerConnection(userToCall._id, rtcConfig);

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      console.log("[WebRTC] offer sent");

      socket.emit("callUser", {
        userToCall: userToCall._id,
        signalData: offer,
        from:       user._id,
        callerInfo: user,
      });
    } catch (err) {
      console.error("[WebRTC] createOffer error:", err);
      cleanupCall();
    }
  }, [user, fetchIceServers, getLocalStream, buildPeerConnection, cleanupCall]);

  // ── acceptCall (we are the callee) ──────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const call = incomingCallRef.current;
    if (!call) return;
    console.log("[WebRTC] accepting call from:", call.callerInfo?.username);

    // Fetch fresh ICE servers AND local stream in parallel
    const [rtcConfig, stream] = await Promise.all([
      fetchIceServers(),
      getLocalStream(),
    ]);

    if (!stream) return;

    setActiveCall({ user: call.callerInfo, isCaller: false });
    setIncomingCall(null);

    const pc = buildPeerConnection(call.from, rtcConfig);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(call.signal));
      console.log("[WebRTC] remote description set (offer)");
      await flushCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("[WebRTC] answer sent");

      socket.emit("answerCall", { to: call.from, signal: answer });
    } catch (err) {
      console.error("[WebRTC] createAnswer error:", err);
      cleanupCall();
    }
  }, [getLocalStream, buildPeerConnection, flushCandidates, cleanupCall]);

  // ── rejectCall ───────────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) return;
    console.log("[WebRTC] call rejected");
    socket.emit("endCall", { to: call.from });
    setIncomingCall(null);
  }, []);

  // ── endCall ──────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    const peerId = remoteUserIdRef.current;
    if (peerId) {
      console.log("[WebRTC] call ended (local), notifying:", peerId);
      socket.emit("endCall", { to: peerId });
    }
    cleanupCall();
  }, [cleanupCall]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        isCalling,
        hasRemoteVideo,
        localVideoRef,
        remoteVideoRef,
        localStreamRef,
        remoteStreamRef,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
