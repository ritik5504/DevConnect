import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import socket from "../socket/socket";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatWindow = ({ selectedUser }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Load history whenever selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      setMessages([]); // clear first, then load
      setLoading(true);
      try {
        const res = await API.get(`/message/${selectedUser._id}`);
        setMessages(res.data.messages || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [selectedUser?._id]);

  // Socket: receive real-time messages (from server echo for sender + delivery for receiver)
  useEffect(() => {
    const handleReceive = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;

      // Only add if this message belongs to the active conversation
      if (
        !selectedUser ||
        !(
          (senderId === selectedUser._id && receiverId === user?._id) ||
          (senderId === user?._id && receiverId === selectedUser._id)
        )
      ) {
        return;
      }

      // Avoid duplicates — check by _id
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [selectedUser, user]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || !selectedUser) return;
    const msgText = text.trim();
    setText("");
    setSending(true);

    // Emit via socket — server will save to DB and echo back to sender
    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: selectedUser._id,
      text: msgText,
    });

    setSending(false);
  };

  if (!selectedUser) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          gap: 12,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 500 }}>Select a conversation</p>
        <p style={{ fontSize: 13 }}>Choose someone to chat with</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--bg-card)",
        }}
      >
        <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, overflow: "hidden", flexShrink: 0 }}>
          {selectedUser.profilePic ? (
            <img src={selectedUser.profilePic} alt={selectedUser.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials(selectedUser.username)
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{selectedUser.username}</div>
          {selectedUser.bio && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedUser.bio}</div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 40, fontSize: 14 }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMine = senderId === user._id;
            return (
              <div
                key={msg._id}
                style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMine ? "var(--accent)" : "var(--bg-hover)",
                    color: isMine ? "white" : "var(--text-primary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  <p>{msg.text}</p>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 10,
          background: "var(--bg-card)",
        }}
      >
        <input
          id="chat-input"
          className="input-field"
          style={{ borderRadius: 12, fontSize: 14 }}
          placeholder={`Message ${selectedUser.username}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "var(--accent)",
            color: "white",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            opacity: !text.trim() || sending ? 0.5 : 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
