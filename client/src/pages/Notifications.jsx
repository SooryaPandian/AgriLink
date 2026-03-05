import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const TYPE_CONFIG = {
  contract_invitation: { label: "Contract Invitation", color: "bg-blue-500/15 text-blue-400", border: "border-l-blue-500", Icon: Bell },
  buyer_counter:       { label: "Buyer Counter",       color: "bg-amber-500/15 text-amber-400", border: "border-l-amber-500", Icon: AlertTriangle },
  farmer_counter:      { label: "Farmer Counter",      color: "bg-violet-500/15 text-violet-400", border: "border-l-violet-500", Icon: Bell },
  contract_accepted:   { label: "Contract Accepted",   color: "bg-green-500/15 text-green-400", border: "border-l-green-500", Icon: CheckCircle },
  contract_rejected:   { label: "Contract Rejected",   color: "bg-red-500/15 text-red-400", border: "border-l-red-500", Icon: XCircle },
  info:                { label: "Info",                color: "bg-sky-500/15 text-sky-400", border: "border-l-sky-500", Icon: Info },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications")
      .then((r) => setNotifications(r.data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30"
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <Bell size={36} style={{ color: "var(--text-dim)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-dim)" }}>No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => {
            const { color, border, Icon, label } = getConfig(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => !notif.read && markRead(notif._id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border border-l-4 ${border} transition-all cursor-pointer ${!notif.read ? "ring-1 ring-green-500/20" : "opacity-70"}`}
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {/* Icon */}
                <div className={`p-2 rounded-xl shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text)" }}>{notif.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
