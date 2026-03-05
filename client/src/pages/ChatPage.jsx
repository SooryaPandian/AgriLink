import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Send, Bot } from 'lucide-react';
import './ChatPage.css';

export default function ChatPage() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef(null);
    const typingTimer = useRef(null);

    useEffect(() => {
        api.get(`/chat/${sessionId}`).then(r => setMessages(r.data.messages));
        const socket = getSocket();
        socket.emit('join_session', sessionId);
        socket.on('chat_message', (msg) => setMessages(prev => [...prev, msg]));
        socket.on('user_typing', ({ userName }) => setTyping(userName));
        socket.on('user_stop_typing', () => setTyping(false));
        return () => {
            socket.emit('leave_session', sessionId);
            socket.off('chat_message');
            socket.off('user_typing');
            socket.off('user_stop_typing');
        };
    }, [sessionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleTyping = () => {
        const socket = getSocket();
        socket.emit('typing', { sessionId, userName: user?.name });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            socket.emit('stop_typing', { sessionId });
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        const t = text.trim();
        setText('');
        try {
            await api.post(`/chat/${sessionId}`, { text: t });
        } catch { setText(t); }
    };

    const isMine = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

    return (
        <div className="chat-page">
            <div className="chat-header">
                <h2>Negotiation Chat</h2>
                <span className="text-muted text-sm">Session ID: {sessionId.slice(-8)}</span>
            </div>

            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg._id} className={`msg-wrap ${msg.type === 'system' ? 'system' : isMine(msg) ? 'mine' : 'theirs'}`}>
                        {msg.type === 'system' ? (
                            <div className="msg-system">
                                <Bot size={14} />
                                <span>{msg.text}</span>
                            </div>
                        ) : (
                            <>
                                {!isMine(msg) && <div className="msg-author">{msg.sender?.name || 'User'}</div>}
                                <div className={`msg-bubble ${msg.type === 'price_proposal' ? 'price' : ''}`}>
                                    {msg.type === 'price_proposal' && <div className="price-tag">💰 Price Proposal</div>}
                                    <span>{msg.text}</span>
                                    <div className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {typing && (
                    <div className="msg-wrap theirs">
                        <div className="msg-bubble typing"><span className="dot" /><span className="dot" /><span className="dot" /></div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
                <input
                    className="form-control"
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => { setText(e.target.value); handleTyping(); }}
                />
                <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
