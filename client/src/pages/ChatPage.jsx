import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { Send, Bot, ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    api.get(`/chat/${sessionId}`).then((r) => setMessages(r.data.messages));
    const socket = getSocket();
    socket.emit("join_session", sessionId);
    socket.on("chat_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("user_typing", ({ userName }) => setTyping(userName));
    socket.on("user_stop_typing", () => setTyping(false));
    return () => {
      socket.emit("leave_session", sessionId);
      socket.off("chat_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit("typing", { sessionId, userName: user?.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { socket.emit("stop_typing", { sessionId }); }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text.trim();
    setText("");
    try { await api.post(`/chat/${sessionId}`, { text: t }); }
    catch { setText(t); }
  };

  const isMine = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border mb-3 shrink-0" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <Link to={-1} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-bold" style={{ color: "var(--text)" }}>Negotiation Chat</h2>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>Session: �{sessionId.slice(-8)}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-1 py-2">
        {messages.map((msg) => {
          if (msg.type === "system") return (
            <div key={msg._id} className="flex items-center justify-center gap-2 py-1">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{ background: "var(--bg-card)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                <Bot size={12} /> {msg.text}
              </div>
            </div>
          );
          const mine = isMine(msg);
          return (
            <div key={msg._id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="text-xs mb-1 px-1 font-semibold" style={{ color: "var(--text-dim)" }}>{msg.sender?.name || "User"}</span>}
              <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm ${mine ? "bg-gradient-to-br from-green-600 to-green-500 text-white rounded-br-sm" : "rounded-bl-sm"} ${msg.type === "price_proposal" ? "border-l-4 border-amber-400" : ""}`}
                style={!mine ? { background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" } : {}}>
                {msg.type === "price_proposal" && <div className="text-xs font-bold text-amber-400 mb-1">Price Proposal</div>}
                <span>{msg.text}</span>
                <div className={`text-xs mt-1 ${mine ? "text-green-200" : ""}`} style={!mine ? { color: "var(--text-dim)" } : {}}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex items-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-3 shrink-0">
        <input
          className="flex-1 px-4 py-3 rounded-2xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
          placeholder="Type a message..."
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
        />
        <button type="submit" disabled={!text.trim()} className="p-3 rounded-2xl font-semibold text-white bg-gradient-to-br from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-40 shadow-lg shadow-green-900/30">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
