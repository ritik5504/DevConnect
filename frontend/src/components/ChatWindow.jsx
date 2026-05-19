import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import socket from "../socket/socket";
import toast from "react-hot-toast";
import { useCall } from "../context/CallContext";

const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatWindow = ({ selectedUser }) => {
  const { user } = useAuth();
  const { initiateCall } = useCall();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const bottomRef = useRef(null);
  const [deleteConvLoading, setDeleteConvLoading] = useState(false);

  const handleDeleteConversation = async () => {
    if (!window.confirm("Are you sure you want to delete all messages in this conversation? This action cannot be undone.")) return;
    try {
      setDeleteConvLoading(true);
      await API.delete(`/message/conversation/${selectedUser._id}`);
      setMessages([]);
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete conversation");
    } finally {
      setDeleteConvLoading(false);
    }
  };

  // Load history whenever selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      setMessages([]);
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

  // Socket: receive real-time messages
  useEffect(() => {
    const handleReceive = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      if (
        !selectedUser ||
        !(
          (senderId === selectedUser._id && receiverId === user?._id) ||
          (senderId === user?._id && receiverId === selectedUser._id)
        )
      ) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
    };

    // Socket: handle remote deletion
    const handleDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    // Socket: handle entire conversation deletion
    const handleConvDeleted = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setMessages([]);
      }
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDeleted", handleDeleted);
    socket.on("conversationDeleted", handleConvDeleted);
    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDeleted", handleDeleted);
      socket.off("conversationDeleted", handleConvDeleted);
    };
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

    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: selectedUser._id,
      text: msgText,
    });

    setSending(false);
  };

  const handleDelete = async (msg) => {
    const msgId = msg._id;
    if (deletingId === msgId) return;

    try {
      setDeletingId(msgId);
      await API.delete(`/message/${msgId}`);

      // Remove from local state immediately
      setMessages((prev) => prev.filter((m) => m._id !== msgId));

      // Broadcast deletion to receiver via socket
      socket.emit("deleteMessage", {
        messageId: msgId,
        senderId: user._id,
        receiverId: selectedUser._id,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
    }
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.username}</div>
          {selectedUser.bio && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.bio}</div>
          )}
        </div>
        
        {/* Video Call Button */}
        <button
          onClick={() => initiateCall(selectedUser)}
          title="Video Call"
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-glow)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        </button>

        {/* Delete Conversation Button */}
        <button
          onClick={handleDeleteConversation}
          title="Delete Conversation"
          disabled={deleteConvLoading}
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
            e.currentTarget.style.borderColor = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          {deleteConvLoading ? (
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          )}
        </button>
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
            const isHovered = hoveredMsg === msg._id;
            const isDeleting = deletingId === msg._id;

            return (
              <div
                key={msg._id}
                style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}
                onMouseEnter={() => setHoveredMsg(msg._id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                {/* Delete button — left side for own messages */}
                {isMine && (
                  <button
                    onClick={() => handleDelete(msg)}
                    disabled={isDeleting}
                    title="Delete message"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--danger)",
                      padding: "4px 6px",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.15s, background 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {isDeleting ? (
                      <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: "var(--danger)" }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 14px",
                    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isMine ? "var(--accent)" : "var(--bg-hover)",
                    color: isMine ? "white" : "var(--text-primary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    opacity: isDeleting ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <p style={{ margin: 0 }}>{msg.text}</p>
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
