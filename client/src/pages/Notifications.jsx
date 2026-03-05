import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_COLOR = {
    contract_invitation: 'var(--success)',
    buyer_counter: 'var(--accent)',
    price_agreed: 'var(--primary)',
    contract_accepted: 'var(--success)',
    contract_rejected: 'var(--danger)',
    negotiation_update: 'var(--info)',
    application_accepted: 'var(--primary)',
};

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetch = () => {
        api.get('/notifications').then(r => {
            setNotifications(r.data.notifications);
            setUnreadCount(r.data.unreadCount);
        }).finally(() => setLoading(false));
    };

    useEffect(fetch, []);

    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
    };

    const markAll = async () => {
        await api.put('/notifications/read-all');
        setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All marked as read');
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: 700 }}>
            <div className="page-header flex-between">
                <div>
                    <h1>Notifications</h1>
                    <p>{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="card empty-state"><Bell size={48} /><p style={{ marginTop: 12 }}>No notifications yet</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notifications.map(n => (
                        <div key={n._id} className="card notif-card" style={{ padding: '16px 20px', cursor: n.isRead ? 'default' : 'pointer', opacity: n.isRead ? 0.75 : 1, borderLeft: `4px solid ${TYPE_COLOR[n.type] || 'var(--border)'}` }}
                            onClick={() => !n.isRead && markRead(n._id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div className="flex gap-2" style={{ marginBottom: 4 }}>
                                        {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                                        <div className="font-semibold text-sm">{n.title}</div>
                                    </div>
                                    <p className="text-sm text-muted" style={{ margin: 0 }}>{n.message}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                    <span className="text-xs text-dim">{new Date(n.createdAt).toLocaleString()}</span>
                                    {n.isRead && <Check size={14} style={{ color: 'var(--success)' }} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
