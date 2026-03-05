import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Users, TrendingUp, MapPin, Calendar } from 'lucide-react';

const STATUS_BADGE = { pending: 'badge-default', in_negotiation: 'badge-warning', contract_offered: 'badge-info', contracted: 'badge-success', rejected: 'badge-danger' };

export default function RequirementDetail() {
    const { id } = useParams();
    const [requirement, setRequirement] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get(`/buyers/requirements/${id}`),
            api.get(`/buyers/requirements/${id}/applications`),
        ]).then(([r, a]) => {
            setRequirement(r.data.requirement);
            setApplications(a.data.applications);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div>;
    if (!requirement) return <div className="page-header"><h1>Not found</h1></div>;

    const avgPrice = applications.length
        ? (applications.reduce((s, a) => s + a.expectedPrice, 0) / applications.length).toFixed(0)
        : '—';

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Link to="/requirements" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back</Link>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem' }}>{requirement.cropName}</h1>
                            <p className="text-muted">{requirement.variety && `Variety: ${requirement.variety}`}</p>
                        </div>
                        <span className={`badge ${({ open: 'badge-success', negotiating: 'badge-warning', contracts_allocated: 'badge-info' }[requirement.status] || 'badge-default')}`}>
                            {requirement.status?.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            ['Required Qty', `${requirement.requiredQuantity} quintals`],
                            ['Quality Grade', requirement.qualityGrade || '—'],
                            ['Expected Price', requirement.initialPriceExpectation ? `₹${requirement.initialPriceExpectation}/q` : '—'],
                            ['Negotiation', requirement.negotiationAllowed ? '✅ Allowed' : '❌ Fixed Price'],
                            ['Transport', requirement.transportResponsibility],
                            ['Pickup/Delivery', requirement.pickupOrDelivery],
                        ].map(([k, v]) => (
                            <div key={k} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div className="text-xs text-dim" style={{ marginBottom: 2 }}>{k}</div>
                                <div className="text-sm font-semibold">{v}</div>
                            </div>
                        ))}
                    </div>
                    {requirement.status === 'open' && applications.length > 0 && (
                        <Link to={`/requirements/${id}/negotiate`} className="btn btn-primary w-full mt-4">Start Negotiation →</Link>
                    )}
                    {requirement.status === 'negotiating' && (
                        <Link to={`/requirements/${id}/negotiate`} className="btn btn-accent w-full mt-4">Continue Negotiation →</Link>
                    )}
                </div>

                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ marginBottom: 12 }}>📍 Location & Timeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className="flex gap-2 text-sm"><MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} /><span>{requirement.targetRegion || '—'}</span></div>
                            {requirement.allowedDistricts?.length > 0 && (
                                <div className="text-sm text-dim">Districts: {requirement.allowedDistricts.join(', ')}</div>
                            )}
                            {requirement.deliveryDate && (
                                <div className="flex gap-2 text-sm"><Calendar size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    <span>Delivery: {new Date(requirement.deliveryDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex gap-3">
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{applications.length}</div>
                                <div className="text-xs text-muted">Applicants</div>
                            </div>
                            <div style={{ width: 1, background: 'var(--border)' }} />
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{avgPrice}</div>
                                <div className="text-xs text-muted">Avg. Price/Q</div>
                            </div>
                            <div style={{ width: 1, background: 'var(--border)' }} />
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--info)' }}>
                                    {applications.length > 0 ? Math.min(...applications.map(a => a.expectedPrice)) : '—'}
                                </div>
                                <div className="text-xs text-muted">Lowest ₹/Q</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: 20 }}>Farmer Applications ({applications.length})</h2>
                {applications.length === 0 ? (
                    <div className="empty-state"><Users size={40} /><p style={{ marginTop: 12 }}>No applications yet</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Farmer</th><th>District/State</th><th>Land Area</th><th>Capacity</th><th>Exp. Qty</th><th>Expected Price</th><th>Rating</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {applications.map(a => (
                                    <tr key={a._id}>
                                        <td>
                                            <div className="font-semibold">{a.farmer?.name}</div>
                                            <div className="text-xs text-dim">{a.farmer?.phone}</div>
                                        </td>
                                        <td className="text-sm">{a.farmerProfile?.district || '—'}, {a.farmerProfile?.state || '—'}</td>
                                        <td className="text-sm">{a.availableLandArea} acres</td>
                                        <td className="text-sm">{a.cropProductionCapacity} q</td>
                                        <td className="text-sm">{a.estimatedProductionQuantity} q</td>
                                        <td><span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{a.expectedPrice}</span></td>
                                        <td>{a.farmerProfile?.rating ? `⭐ ${a.farmerProfile.rating}` : '—'}</td>
                                        <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-default'}`}>{a.status?.replace(/_/g, ' ')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
