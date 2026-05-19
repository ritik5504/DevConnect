import { createContext, useContext, useState, useEffect, useRef } from "react";
import socket from "../socket/socket";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Call States
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  
  // WebRTC Connection Ref
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // STUN servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  const processQueuedCandidates = async () => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    socket.on("incomingCall", async ({ signal, from, callerInfo }) => {
      if (activeCall || isCalling) return;
      setIncomingCall({ signal, from, callerInfo });
    });

    socket.on("callAccepted", async (signal) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          await processQueuedCandidates();
        } catch (e) {
          console.error("Error setting remote description on accept", e);
        }
      }
    });

    socket.on("iceCandidate", async (candidate) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    socket.on("endCall", () => {
      cleanupCall();
      toast("Call ended", { icon: "📞" });
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("endCall");
    };
  }, [user, activeCall, isCalling]);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      toast.error("Could not access camera/microphone");
      console.error(err);
      return null;
    }
  };

  const createPeerConnection = (receiverId, stream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnection.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStreamObj] = event.streams;
      setRemoteStream(remoteStreamObj);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamObj;
    };

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { to: receiverId, candidate: event.candidate });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanupCall();
      }
    };

    return pc;
  };

  const initiateCall = async (userToCall) => {
    setIsCalling(true);
    const stream = await initLocalStream();
    if (!stream) {
      setIsCalling(false);
      return;
    }

    setActiveCall({ user: userToCall, isCaller: true });
    
    const pc = createPeerConnection(userToCall._id, stream);
    
    // Create offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("callUser", {
        userToCall: userToCall._id,
        signalData: offer,
        from: user._id,
        callerInfo: user
      });
    } catch (err) {
      console.error("Error creating offer", err);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    const stream = await initLocalStream();
    if (!stream) return;

    setActiveCall({ user: incomingCall.callerInfo, isCaller: false });
    const pc = createPeerConnection(incomingCall.from, stream);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", { to: incomingCall.from, signal: answer });
      setIncomingCall(null);
      await processQueuedCandidates();
    } catch (err) {
      console.error("Error creating answer", err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("endCall", { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (activeCall) {
      const peerId = activeCall.user._id;
      socket.emit("endCall", { to: peerId });
    } else if (isCalling) {
      if (activeCall?.user?._id) {
         socket.emit("endCall", { to: activeCall.user._id });
      }
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsCalling(false);
    iceCandidatesQueue.current = [];
  };

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        isCalling,
        localStream,
        remoteStream,
        localVideoRef,
        remoteVideoRef,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
