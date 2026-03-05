import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RequirementsList from './pages/RequirementsList';
import CreateRequirement from './pages/CreateRequirement';
import RequirementDetail from './pages/RequirementDetail';
import NegotiationPanel from './pages/NegotiationPanel';
import Contracts from './pages/Contracts';
import ChatPage from './pages/ChatPage';
import Notifications from './pages/Notifications';
import EditProfile from './pages/EditProfile';
import './index.css';

function Spinner() {
    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
            <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
        </div>
    );
}

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'buyer') return <Navigate to="/login" replace />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Spinner />;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};

function ToasterWrapper() {
    const { theme } = useTheme();
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: theme === 'dark'
                    ? { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
                    : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' },
            }}
        />
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <ToasterWrapper />
                    <Routes>
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="requirements" element={<RequirementsList />} />
                            <Route path="requirements/new" element={<CreateRequirement />} />
                            <Route path="requirements/:id" element={<RequirementDetail />} />
                            <Route path="requirements/:id/negotiate" element={<NegotiationPanel />} />
                            <Route path="contracts" element={<Contracts />} />
                            <Route path="chat/:sessionId" element={<ChatPage />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="profile" element={<EditProfile />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

