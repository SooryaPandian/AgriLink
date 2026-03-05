import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Sprout, Users, TrendingUp, FileCheck, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--primary)' }) => (
    <div className="card stat-card">
        <div className="stat-icon" style={{ background: `${color}20`, color }}>
            <Icon size={22} />
        </div>
        <div className="stat-body">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    </div>
);

const MOCK_TREND = [
    { round: 'Initial', price: 2400 },
    { round: 'Round 1', price: 2200 },
    { round: 'Round 2', price: 2050 },
    { round: 'Final', price: 1950 },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.get('/buyers/dashboard'), api.get('/buyers/requirements')])
            .then(([a, r]) => {
                setAnalytics(a.data.analytics);
                setRequirements(r.data.requirements.slice(0, 5));
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>
    );

    const { totalRequirements = 0, openRequirements = 0, totalApplications = 0,
        averageFarmerPrice = 0, totalContracts = 0, acceptedContracts = 0, fulfilmentRate = 0 } = analytics || {};

    const statusColor = (s) => ({ open: 'var(--success)', negotiating: 'var(--warning)', contracts_allocated: 'var(--info)', fulfilled: 'var(--primary)', cancelled: 'var(--danger)' }[s] || 'var(--text-dim)');
    const statusBadge = (s) => ({ open: 'badge-success', negotiating: 'badge-warning', contracts_allocated: 'badge-info', fulfilled: 'badge-primary', cancelled: 'badge-danger' }[s] || 'badge-default');

    return (
        <div>
            <div className="page-header flex-between">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, {user?.name} 👋</p>
                </div>
                <Link to="/requirements/new" className="btn btn-primary">
                    <Plus size={18} /> Post Requirement
                </Link>
            </div>

            <div className="grid-4" style={{ marginBottom: 28 }}>
                <StatCard icon={Sprout} label="Total Requirements" value={totalRequirements} sub={`${openRequirements} open`} />
                <StatCard icon={Users} label="Total Applications" value={totalApplications} color="var(--info)" />
                <StatCard icon={TrendingUp} label="Avg. Farmer Price" value={`₹${averageFarmerPrice}/q`} color="var(--accent)" />
                <StatCard icon={FileCheck} label="Contract Rate" value={`${fulfilmentRate}%`} sub={`${acceptedContracts}/${totalContracts} accepted`} color="var(--success)" />
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="card">
                    <h3 style={{ marginBottom: 4 }}>Negotiation Price Trend</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: 20 }}>Sample price trajectory across rounds</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={MOCK_TREND}>
                            <defs>
                                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="round" stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={v => [`₹${v}`, 'Price']} />
                            <Area type="monotone" dataKey="price" stroke="var(--primary)" fill="url(#priceGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                        <h3>Recent Requirements</h3>
                        <Link to="/requirements" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
                    </div>
                    {requirements.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <p>No requirements yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {requirements.map((r) => (
                                <Link key={r._id} to={`/requirements/${r._id}`} style={{ textDecoration: 'none' }}>
                                    <div className="req-row">
                                        <div>
                                            <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.cropName} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({r.variety})</span></div>
                                            <div className="text-xs text-dim">{r.requiredQuantity} q · {r.targetRegion}</div>
                                        </div>
                                        <span className={`badge ${statusBadge(r.status)}`}>{r.status?.replace(/_/g, ' ')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .stat-card { display: flex; align-items: flex-start; gap: 16px; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text); line-height: 1; }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; font-weight: 500; }
        .stat-sub { font-size: 0.75rem; color: var(--text-dim); margin-top: 2px; }
        .req-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); transition: var(--transition); }
        .req-row:hover { border-color: var(--primary); }
      `}</style>
        </div>
    );
}
