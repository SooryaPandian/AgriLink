import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Filter, Eye, Play, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = { open: 'badge-success', negotiating: 'badge-warning', contracts_allocated: 'badge-info', fulfilled: 'badge-primary', cancelled: 'badge-danger' };

export default function RequirementsList() {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/buyers/requirements').then(r => setRequirements(r.data.requirements)).finally(() => setLoading(false));
    }, []);

    const filtered = requirements.filter(r =>
        r.cropName?.toLowerCase().includes(search.toLowerCase()) ||
        r.targetRegion?.toLowerCase().includes(search.toLowerCase())
    );

    const startNegotiation = async (id) => {
        try {
            await api.post(`/negotiation/${id}/start`);
            toast.success('Negotiation session started!');
            navigate(`/requirements/${id}/negotiate`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start negotiation');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header flex-between">
                <div>
                    <h1>Crop Requirements</h1>
                    <p>Manage your posted requirements and track applications</p>
                </div>
                <Link to="/requirements/new" className="btn btn-primary"><Plus size={18} /> Post New</Link>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input className="form-control" placeholder="Search by crop or region..."
                        style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card empty-state">
                    <Sprout size={48} />
                    <h3 style={{ marginTop: 12 }}>No requirements yet</h3>
                    <p className="text-muted" style={{ marginBottom: 20 }}>Post your first crop requirement to connect with farmers.</p>
                    <Link to="/requirements/new" className="btn btn-primary"><Plus size={16} /> Post Requirement</Link>
                </div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Crop</th><th>Qty (Quintals)</th><th>Region</th><th>Price/Q</th>
                                <th>Applications</th><th>Status</th><th>Posted</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <div className="font-semibold">{r.cropName}</div>
                                        <div className="text-xs text-dim">{r.variety}</div>
                                    </td>
                                    <td>{r.requiredQuantity}</td>
                                    <td>{r.targetRegion || '—'}</td>
                                    <td>₹{r.initialPriceExpectation || '—'}</td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: r.applicationCount > 0 ? 'var(--primary)' : 'var(--text-dim)' }}>
                                            {r.applicationCount || 0}
                                        </span>
                                    </td>
                                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-default'}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                                    <td className="text-dim text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link to={`/requirements/${r._id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                                            {r.status === 'open' && r.applicationCount > 0 && (
                                                <button className="btn btn-accent btn-sm" onClick={() => startNegotiation(r._id)}>
                                                    <Play size={14} /> Negotiate
                                                </button>
                                            )}
                                            {r.status === 'negotiating' && (
                                                <Link to={`/requirements/${r._id}/negotiate`} className="btn btn-primary btn-sm">
                                                    <Play size={14} /> Continue
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
