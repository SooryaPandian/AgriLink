import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileCheck, Clock, CheckCircle, XCircle, Users } from 'lucide-react';

const STATUS_BADGE = { invited: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger', expired: 'badge-default', fulfilled: 'badge-primary' };
const STATUS_ICON = { invited: Clock, accepted: CheckCircle, rejected: XCircle, fulfilled: FileCheck };

export default function Contracts() {
    const [contracts, setContracts] = useState([]);
    const [waitingMap, setWaitingMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('contracts');

    useEffect(() => {
        api.get('/contracts').then(r => setContracts(r.data.contracts)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div>;

    const byStatus = (s) => contracts.filter(c => c.status === s);

    return (
        <div>
            <div className="page-header">
                <h1>Contract Management</h1>
                <p>View allocated contracts and waiting list farmers</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {['contracts', 'invited', 'accepted', 'rejected'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                        {' '}
                        <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                            ({t === 'contracts' ? contracts.length : byStatus(t).length})
                        </span>
                    </button>
                ))}
            </div>

            {contracts.length === 0 ? (
                <div className="card empty-state">
                    <FileCheck size={48} />
                    <h3 style={{ marginTop: 12 }}>No contracts yet</h3>
                    <p className="text-muted">Contracts appear here after you finalize a negotiation.</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Crop</th><th>Farmer</th><th>Agreed Price</th><th>Quantity</th><th>Delivery</th><th>Invited At</th><th>Status</th><th>Chat</th></tr>
                        </thead>
                        <tbody>
                            {(tab === 'contracts' ? contracts : byStatus(tab)).map(c => {
                                const Icon = STATUS_ICON[c.status] || Clock;
                                return (
                                    <tr key={c._id}>
                                        <td>
                                            <div className="font-semibold">{c.requirement?.cropName}</div>
                                            <div className="text-xs text-dim">{c.requirement?.variety}</div>
                                        </td>
                                        <td>
                                            <div className="font-semibold">{c.farmer?.name}</div>
                                            <div className="text-xs text-dim">{c.farmer?.phone}</div>
                                        </td>
                                        <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{c.agreedPrice}/q</span></td>
                                        <td>{c.contractedQuantity} q</td>
                                        <td className="text-sm">{c.deliveryDate ? new Date(c.deliveryDate).toLocaleDateString() : '—'}</td>
                                        <td className="text-xs text-dim">{new Date(c.invitedAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[c.status] || 'badge-default'}`}>
                                                <Icon size={10} /> {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            {c.requirement?.negotiationSession && (
                                                <Link to={`/chat/${c.requirement.negotiationSession}`} className="btn btn-ghost btn-sm">Chat</Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
