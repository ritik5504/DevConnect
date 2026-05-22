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
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Refs for tracking active call status in persistent socket listeners
  const activeCallRef = useRef(activeCall);
  const isCallingRef = useRef(isCalling);

  useEffect(() => {
    activeCallRef.current = activeCall;
    isCallingRef.current = isCalling;
  }, [activeCall, isCalling]);

  // STUN & TURN servers configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      {
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
          "turns:openrelay.metered.ca:443?transport=tcp"
        ],
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  };

  const processQueuedCandidates = async () => {
    if (peerConnection.current && peerConnection.current.remoteDescription) {
      console.log(`CallContext: Processing ${iceCandidatesQueue.current.length} queued ICE candidates`);
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("CallContext: Added queued ICE candidate successfully");
        } catch (e) {
          console.error("CallContext: Error adding queued ice candidate", e);
        }
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    console.log("CallContext: Registering persistent socket listeners for user:", user._id);

    const handleIncomingCall = async ({ signal, from, callerInfo }) => {
      console.log("CallContext: incomingCall event received from:", from);
      if (activeCallRef.current || isCallingRef.current) {
        console.warn("CallContext: Incoming call ignored because a call is already active or in progress.");
        return;
      }
      setIncomingCall({ signal, from, callerInfo });
    };

    const handleCallAccepted = async (signal) => {
      console.log("CallContext: callAccepted event received");
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("CallContext: Remote description set on accepted call");
          await processQueuedCandidates();
        } catch (e) {
          console.error("CallContext: Error setting remote description on accept", e);
        }
      } else {
        console.warn("CallContext: callAccepted received but peerConnection.current is null");
      }
    };

    const handleIceCandidate = async (candidate) => {
      console.log("CallContext: iceCandidate event received");
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("CallContext: Added incoming ICE candidate immediately");
        } catch (e) {
          console.error("CallContext: Error adding immediate ice candidate", e);
        }
      } else {
        console.log("CallContext: Queueing incoming ICE candidate");
        iceCandidatesQueue.current.push(candidate);
      }
    };

    const handleEndCall = () => {
      console.log("CallContext: endCall event received");
      cleanupCall();
      toast("Call ended", { icon: "📞" });
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("endCall", handleEndCall);

    return () => {
      console.log("CallContext: Cleaning up persistent socket listeners");
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("endCall", handleEndCall);
    };
  }, [user]);

  const initLocalStream = async () => {
    try {
      console.log("CallContext: Initializing local stream");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(err => console.error("Error playing local stream:", err));
      }
      return stream;
    } catch (err) {
      toast.error("Could not access camera/microphone");
      console.error(err);
      return null;
    }
  };

  const createPeerConnection = (receiverId, stream) => {
    console.log("CallContext: Creating peer connection for receiver:", receiverId);
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnection.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("CallContext: Remote track received:", event.track.kind, event.track.id);
      
      // Get the stream from the event, or fallback to our persistent stream ref
      let stream = event.streams[0];
      
      if (!stream) {
        console.log("CallContext: No event.streams[0], using/creating remoteStreamRef");
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (!remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
        stream = remoteStreamRef.current;
      } else {
        remoteStreamRef.current = stream;
      }
      
      // Set the state once to trigger UI updates, but avoid changing state if we already have the same stream reference
      setRemoteStream((prev) => {
        if (prev !== stream) {
          return stream;
        }
        return prev;
      });
      
      // Directly assign to the video element if mounted and not already set
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== stream) {
          console.log("CallContext: Setting remoteVideoRef.current.srcObject to remote stream");
          remoteVideoRef.current.srcObject = stream;
        }
        
        // Always try to play in case it was paused or not playing
        remoteVideoRef.current.play().catch(err => {
          console.warn("CallContext: Auto-play remote stream failed:", err);
        });
      }
    };

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("CallContext: Sending ICE candidate to peer");
        socket.emit("iceCandidate", { to: receiverId, candidate: event.candidate });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("CallContext: connectionState change:", pc.connectionState);
      if (pc.connectionState === "failed") {
        console.warn("CallContext: Peer connection failed. Cleaning up call.");
        cleanupCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("CallContext: iceConnectionState change:", pc.iceConnectionState);
    };

    return pc;
  };

  const initiateCall = async (userToCall) => {
    console.log("CallContext: Initiating call to user:", userToCall.username);
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
      console.log("CallContext: Local description set (offer)");
      
      socket.emit("callUser", {
        userToCall: userToCall._id,
        signalData: offer,
        from: user._id,
        callerInfo: user
      });
    } catch (err) {
      console.error("CallContext: Error creating offer", err);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    console.log("CallContext: Accepting call from:", incomingCall.callerInfo.username);
    
    const stream = await initLocalStream();
    if (!stream) return;

    setActiveCall({ user: incomingCall.callerInfo, isCaller: false });
    const pc = createPeerConnection(incomingCall.from, stream);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      console.log("CallContext: Remote description set (offer)");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("CallContext: Local description set (answer)");

      socket.emit("answerCall", { to: incomingCall.from, signal: answer });
      setIncomingCall(null);
      await processQueuedCandidates();
    } catch (err) {
      console.error("CallContext: Error creating answer", err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      console.log("CallContext: Rejecting call");
      socket.emit("endCall", { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    console.log("CallContext: Ending call");
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
    console.log("CallContext: Performing call cleanup");
    
    // Close peer connection
    if (peerConnection.current) {
      // Remove event handlers to prevent further callbacks
      peerConnection.current.onicecandidate = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.oniceconnectionstatechange = null;
      
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Stop all local tracks using the ref to avoid stale closure issues
    if (localStreamRef.current) {
      console.log("CallContext: Stopping local stream tracks from ref");
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`CallContext: Stopped track: ${track.kind}`);
      });
      localStreamRef.current = null;
    }
    
    // Fallback: also stop tracks from localStream state if available
    if (localStream) {
      console.log("CallContext: Stopping local stream tracks from state");
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (remoteStreamRef.current) {
      console.log("CallContext: Stopping remote stream tracks from ref");
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    
    if (remoteStream) {
      console.log("CallContext: Stopping remote stream tracks from state");
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    // Set srcObject to null on video elements to release camera/mic hold and black out video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setLocalStream(null);
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
