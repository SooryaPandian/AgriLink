import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function NegotiationPanel() {
    const { id: requirementId } = useParams();
    const [session, setSession] = useState(null);
    const [requirement, setRequirement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [counterPrice, setCounterPrice] = useState('');
    const [note, setNote] = useState('');
    const [acting, setActing] = useState(false);

    const fetch = () => {
        Promise.all([
            api.get(`/negotiation/${requirementId}`),
            api.get(`/buyers/requirements/${requirementId}`),
        ]).then(([n, r]) => {
            setSession(n.data.session);
            setRequirement(r.data.requirement);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetch();
        const socket = getSocket();
        socket.on('negotiation_update', fetch);
        return () => socket.off('negotiation_update', fetch);
    }, [requirementId]);

    const buyerAction = async (action) => {
        if (action === 'counter' && (!counterPrice || isNaN(Number(counterPrice)))) {
            toast.error('Enter a valid counter price');
            return;
        }
        setActing(true);
        try {
            const payload = { action };
            if (action === 'counter') { payload.counterPrice = Number(counterPrice); payload.note = note; }
            const { data } = await api.post(`/negotiation/${requirementId}/buyer-action`, payload);
            setSession(data.session);
            toast.success(action === 'accept' ? 'Price accepted! Contracts being allocated.' : 'Counter offer sent to all farmers.');
            setCounterPrice(''); setNote('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setActing(false);
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div>;
    if (!session) return (
        <div className="page-header">
            <Link to={`/requirements/${requirementId}`} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back</Link>
            <br /><br />
            <div className="card text-center" style={{ padding: '48px 32px' }}>
                <h2>No negotiation session found</h2>
                <p className="text-muted">Start negotiation from the requirement page if there are applications.</p>
            </div>
        </div>
    );

    const currentRound = session?.rounds?.[session.currentRound - 1];
    const priceHistory = session.rounds.map(r => ({ round: `R${r.roundNumber}`, price: r.proposedPrice, counterPrice: r.buyerCounterPrice }));

    const statusInfo = {
        buyer_review: { label: '⏳ Awaiting Your Decision', color: 'var(--warning)' },
        farmer_review: { label: '🧑‍🌾 Farmers Reviewing Counter', color: 'var(--info)' },
        agreed: { label: '✅ Price Agreed', color: 'var(--success)' },
        open: { label: '🟢 Open', color: 'var(--primary)' },
        closed: { label: '🔒 Closed', color: 'var(--text-dim)' },
    };
    const si = statusInfo[session.status] || statusInfo.open;

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <Link to={`/requirements/${requirementId}`} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back to Requirement</Link>
            </div>

            <div className="page-header flex-between" style={{ marginBottom: 20 }}>
                <div>
                    <h1>Negotiation – {requirement?.cropName}</h1>
                    <p>Round {session.currentRound} | <span style={{ color: si.color, fontWeight: 600 }}>{si.label}</span></p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={fetch}><RefreshCw size={14} /> Refresh</button>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
                {[
                    ['Optimal Price', `₹${session.optimalPrice || '—'}/q`, 'var(--primary)'],
                    ['Mean Price', `₹${session.meanPrice || '—'}/q`, 'var(--info)'],
                    ['Median Price', `₹${session.medianPrice || '—'}/q`, 'var(--accent)'],
                ].map(([label, val, color]) => (
                    <div key={label} className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{val}</div>
                        <div className="text-sm text-muted">{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>Price Trajectory</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="round" stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                                formatter={(v, n) => [`₹${v}`, n === 'price' ? 'Optimal' : 'Counter']} />
                            <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} name="price" />
                            <Line type="monotone" dataKey="counterPrice" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'var(--accent)' }} name="counter" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>Current Round {session.currentRound} – Farmer Responses</h3>
                    {currentRound?.farmerResponses?.length === 0 ? (
                        <p className="text-muted">No farmer responses yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {currentRound?.farmerResponses?.map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <span className="text-sm font-semibold">{r.farmer?.name || `Farmer ${i + 1}`}</span>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {r.action === 'accepted' && <span className="badge badge-success">Accepted</span>}
                                        {r.action === 'countered' && <><span className="badge badge-warning">Counter</span><span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>₹{r.counterPrice}</span></>}
                                        {r.action === 'pending' && <span className="badge badge-default">Pending</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {session.status === 'buyer_review' && session.status !== 'agreed' && (
                <div className="card">
                    <h3 style={{ marginBottom: 20 }}>Your Action – Round {session.currentRound}</h3>
                    <p className="text-muted" style={{ marginBottom: 20 }}>
                        System proposed optimal price: <strong style={{ color: 'var(--primary)' }}>₹{currentRound?.proposedPrice}/quintal</strong>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div className="form-group">
                                    <label>Counter Price (₹/quintal)</label>
                                    <input className="form-control" type="number" placeholder="Enter counter offer..." value={counterPrice} onChange={e => setCounterPrice(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ flex: 2, minWidth: 200 }}>
                                <div className="form-group">
                                    <label>Note to farmers (optional)</label>
                                    <input className="form-control" placeholder="e.g., Price is final due to market rates..." value={note} onChange={e => setNote(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary btn-lg" disabled={acting} onClick={() => buyerAction('accept')}>
                                <CheckCircle size={18} /> Accept ₹{currentRound?.proposedPrice}/q
                            </button>
                            <button className="btn btn-accent" disabled={acting} onClick={() => buyerAction('counter')}>
                                Send Counter Offer
                            </button>
                            <Link to={`/chat/${session._id}`} className="btn btn-ghost">
                                <MessageSquare size={16} /> Open Chat
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {session.status === 'agreed' && (
                <div className="card" style={{ borderColor: 'var(--success)', background: 'rgba(34,197,94,0.05)', textAlign: 'center', padding: '40px' }}>
                    <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h2>Price Agreed at ₹{session.finalAgreedPrice}/quintal</h2>
                    <p className="text-muted" style={{ marginTop: 8 }}>Contracts have been allocated to qualifying farmers. Check the Contracts page.</p>
                    <Link to="/contracts" className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>View Contracts →</Link>
                </div>
            )}

            {session.status === 'farmer_review' && (
                <div className="card" style={{ textAlign: 'center', padding: '32px', borderColor: 'var(--info)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                    <h3>Waiting for farmers to respond</h3>
                    <p className="text-muted">Counter offer of ₹{currentRound?.buyerCounterPrice}/q has been sent. Check back soon or refresh.</p>
                    <Link to={`/chat/${session._id}`} className="btn btn-ghost" style={{ marginTop: 16 }}><MessageSquare size={16} /> Open Chat</Link>
                </div>
            )}
        </div>
    );
}
