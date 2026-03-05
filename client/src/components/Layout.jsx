import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import {
    LayoutDashboard, Sprout, FileText, MessageSquare, Bell, LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/requirements', icon: Sprout, label: 'Requirements' },
    { to: '/contracts', icon: FileText, label: 'Contracts' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Layout() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) return;
        const socket = getSocket();
        socket.emit('join_user', user._id);
        socket.on('notification', (notif) => {
            toast(notif.title, { icon: '🔔' });
            setUnread((n) => n + 1);
        });
        return () => { socket.off('notification'); };
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🌾</span>
                        {!collapsed && <span className="logo-text">AgriLink</span>}
                    </div>
                    <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Icon size={20} />
                            {!collapsed && <span>{label}</span>}
                            {label === 'Notifications' && unread > 0 && !collapsed && (
                                <span className="badge-count">{unread}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                        {!collapsed && (
                            <div className="user-details">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role">{profile?.companyName || 'Buyer'}</span>
                            </div>
                        )}
                    </div>
                    <button className="btn-logout" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
