import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

export default function CreateRequirement() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        cropName: '', variety: '', requiredQuantity: '', qualityGrade: 'A',
        plantingDate: '', harvestDate: '', deliveryDate: '',
        targetRegion: '', allowedDistricts: '',
        minFarmSize: '', requiredCertifications: '', farmingPractices: '',
        initialPriceExpectation: '', negotiationAllowed: true,
        pickupOrDelivery: 'pickup', transportResponsibility: 'buyer',
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                requiredQuantity: Number(form.requiredQuantity),
                minFarmSize: Number(form.minFarmSize) || undefined,
                initialPriceExpectation: Number(form.initialPriceExpectation) || undefined,
                allowedDistricts: form.allowedDistricts.split(',').map(s => s.trim()).filter(Boolean),
                requiredCertifications: form.requiredCertifications.split(',').map(s => s.trim()).filter(Boolean),
            };
            await api.post('/buyers/requirements', payload);
            toast.success('Requirement posted successfully!');
            navigate('/requirements');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post requirement');
        } finally {
            setLoading(false);
        }
    };

    const Section = ({ title, children }) => (
        <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 20, color: 'var(--primary)' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        </div>
    );

    return (
        <div style={{ maxWidth: 800 }}>
            <div className="page-header flex-between">
                <div>
                    <h1>Post Crop Requirement</h1>
                    <p>Define what crop you need and connect with farmers</p>
                </div>
                <button className="btn btn-ghost" onClick={() => navigate('/requirements')}><ArrowLeft size={16} /> Back</button>
            </div>

            <form onSubmit={handleSubmit}>
                <Section title="🌱 Crop Information">
                    <div className="grid-2">
                        <div className="form-group"><label>Crop Name *</label>
                            <input className="form-control" required placeholder="e.g., Rice, Wheat, Tomato" value={form.cropName} onChange={e => set('cropName', e.target.value)} /></div>
                        <div className="form-group"><label>Variety</label>
                            <input className="form-control" placeholder="e.g., Basmati, Durum" value={form.variety} onChange={e => set('variety', e.target.value)} /></div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group"><label>Required Quantity (Quintals) *</label>
                            <input className="form-control" type="number" required min={1} value={form.requiredQuantity} onChange={e => set('requiredQuantity', e.target.value)} /></div>
                        <div className="form-group"><label>Quality Grade</label>
                            <select className="form-control" value={form.qualityGrade} onChange={e => set('qualityGrade', e.target.value)}>
                                <option value="A">Grade A (Premium)</option>
                                <option value="B">Grade B (Standard)</option>
                                <option value="C">Grade C (Commercial)</option>
                                <option value="organic">Organic Certified</option>
                            </select></div>
                    </div>
                </Section>

                <Section title="📅 Timeline">
                    <div className="grid-3">
                        <div className="form-group"><label>Planting Date</label>
                            <input className="form-control" type="date" value={form.plantingDate} onChange={e => set('plantingDate', e.target.value)} /></div>
                        <div className="form-group"><label>Harvest Date</label>
                            <input className="form-control" type="date" value={form.harvestDate} onChange={e => set('harvestDate', e.target.value)} /></div>
                        <div className="form-group"><label>Delivery Date</label>
                            <input className="form-control" type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} /></div>
                    </div>
                </Section>

                <Section title="📍 Location">
                    <div className="grid-2">
                        <div className="form-group"><label>Target Region</label>
                            <input className="form-control" placeholder="e.g., Tamil Nadu" value={form.targetRegion} onChange={e => set('targetRegion', e.target.value)} /></div>
                        <div className="form-group"><label>Allowed Districts (comma-separated)</label>
                            <input className="form-control" placeholder="Trichy, Salem, Erode" value={form.allowedDistricts} onChange={e => set('allowedDistricts', e.target.value)} /></div>
                    </div>
                </Section>

                <Section title="📋 Contract Conditions">
                    <div className="grid-2">
                        <div className="form-group"><label>Min. Farm Size (Acres)</label>
                            <input className="form-control" type="number" min={0} value={form.minFarmSize} onChange={e => set('minFarmSize', e.target.value)} /></div>
                        <div className="form-group"><label>Required Certifications</label>
                            <input className="form-control" placeholder="Organic, GAP, ISO..." value={form.requiredCertifications} onChange={e => set('requiredCertifications', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Farming Practices Notes</label>
                        <textarea className="form-control" rows={3} placeholder="Describe required farming practices..." value={form.farmingPractices} onChange={e => set('farmingPractices', e.target.value)} /></div>
                </Section>

                <Section title="💰 Price & Logistics">
                    <div className="grid-2">
                        <div className="form-group"><label>Expected Price (₹ per quintal)</label>
                            <input className="form-control" type="number" min={0} value={form.initialPriceExpectation} onChange={e => set('initialPriceExpectation', e.target.value)} /></div>
                        <div className="form-group"><label>Negotiation</label>
                            <select className="form-control" value={form.negotiationAllowed ? 'yes' : 'no'} onChange={e => set('negotiationAllowed', e.target.value === 'yes')}>
                                <option value="yes">Negotiation Allowed</option>
                                <option value="no">Fixed Price</option>
                            </select></div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group"><label>Pickup / Delivery</label>
                            <select className="form-control" value={form.pickupOrDelivery} onChange={e => set('pickupOrDelivery', e.target.value)}>
                                <option value="pickup">Pickup from Farm</option>
                                <option value="delivery">Farmer Delivers</option>
                                <option value="both">Both Options</option>
                            </select></div>
                        <div className="form-group"><label>Transport Responsibility</label>
                            <select className="form-control" value={form.transportResponsibility} onChange={e => set('transportResponsibility', e.target.value)}>
                                <option value="buyer">Buyer</option>
                                <option value="farmer">Farmer</option>
                                <option value="shared">Shared</option>
                            </select></div>
                    </div>
                </Section>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                    {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <Save size={18} />}
                    {loading ? 'Posting...' : 'Post Requirement'}
                </button>
            </form>
        </div>
    );
}
