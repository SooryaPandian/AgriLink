import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role !== 'buyer') {
                toast.error('This portal is for buyers only. Use the mobile app for farmer access.');
                return;
            }
            toast.success(`Welcome back, ${user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-card">
                <div className="auth-logo">
                    <span>🌾</span>
                    <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>AgriLink</span>
                </div>
                <h1>Buyer Portal</h1>
                <p className="text-muted" style={{ marginBottom: 28 }}>Sign in to manage your crop contracts</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-control" type="email" placeholder="company@example.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Password</label>
                        <input className="form-control" type={showPass ? 'text' : 'password'} placeholder="Password"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                            style={{ paddingRight: 44 }} />
                        <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <LogIn size={18} />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-4 text-muted text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register as Buyer</Link>
                </p>
            </div>
        </div>
    );
}
