import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getSocket } from "../services/socket";
import {
  LayoutDashboard, Sprout, FileText, Bell, LogOut, ChevronRight, ChevronLeft, Sun, Moon, UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const NAV = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/requirements", icon: Sprout,          label: "Requirements" },
  { to: "/contracts",    icon: FileText,         label: "Contracts" },
  { to: "/notifications",icon: Bell,             label: "Notifications" },
  { to: "/profile",      icon: UserCircle,       label: "Company Profile" },
];

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("join_user", user._id);
    socket.on("notification", (notif) => {
      toast(notif.title, { icon: "🔔" });
      setUnread((n) => n + 1);
    });
    return () => { socket.off("notification"); };
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const isDark = theme === "dark";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 transition-all duration-300 border-r ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Sprout size={22} className="text-green-500" />
              <span className="font-extrabold text-lg bg-linear-to-r from-green-500 to-amber-500 bg-clip-text text-transparent">
                AgriLink
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
            style={{ color: "var(--text-muted)" }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative ${
                  isActive
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/30"
                    : "hover:bg-white/10"
                }`
              }
              style={({ isActive }) => ({ color: isActive ? "#fff" : "var(--text-muted)" })}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {label === "Notifications" && unread > 0 && (
                <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
            title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
          >
            {isDark ? <Sun size={18} className="shrink-0 text-amber-400" /> : <Moon size={18} className="shrink-0 text-sky-400" />}
            {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* User + Logout */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{user?.name}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-dim)" }}>{profile?.companyName || "Buyer"}</div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
