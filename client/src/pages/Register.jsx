import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import './Auth.css';

const STEPS = ['Account', 'Company', 'Done'];

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' });
    const [company, setCompany] = useState({ companyName: '', registrationNumber: '', industryType: '', headOfficeLocation: '', procurementRegion: '' });

    const handleAccount = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ ...account, role: 'buyer' });
            setStep(1);
            toast.success('Account created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCompany = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...company,
                procurementRegion: company.procurementRegion.split(',').map((s) => s.trim()).filter(Boolean),
            };
            await api.put('/buyers/profile', payload);
            setStep(2);
            toast.success('Company profile saved!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-card" style={{ maxWidth: 520 }}>
                <div className="auth-logo">
                    <span>🌾</span>
                    <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>AgriLink</span>
                </div>
                <h1 style={{ marginBottom: 8 }}>Register as Buyer</h1>
                <p className="text-muted" style={{ marginBottom: 24 }}>Create your company account to post requirements</p>

                {/* Step indicator */}
                <div className="steps">
                    {STEPS.map((label, i) => (
                        <React.Fragment key={label}>
                            <div className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                                <div className="step-num">{i < step ? <Check size={14} /> : i + 1}</div>
                                <div className="step-label">{label}</div>
                            </div>
                            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {step === 0 && (
                    <form onSubmit={handleAccount} className="auth-form">
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-control" placeholder="Your name" required
                                    value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-control" placeholder="+91 90000 00000" required
                                    value={account.phone} onChange={e => setAccount({ ...account, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input className="form-control" type="email" placeholder="you@company.com" required
                                value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input className="form-control" type="password" placeholder="Min 6 characters" minLength={6} required
                                value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} />
                        </div>
                        <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Continue →'}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <form onSubmit={handleCompany} className="auth-form">
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Company Name</label>
                                <input className="form-control" placeholder="Acme Agro Pvt Ltd" required
                                    value={company.companyName} onChange={e => setCompany({ ...company, companyName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Reg. Number</label>
                                <input className="form-control" placeholder="CIN/GSTIN"
                                    value={company.registrationNumber} onChange={e => setCompany({ ...company, registrationNumber: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Industry Type</label>
                            <select className="form-control" value={company.industryType} onChange={e => setCompany({ ...company, industryType: e.target.value })}>
                                <option value="">Select industry</option>
                                <option>Food Processing</option>
                                <option>Export</option>
                                <option>Retail</option>
                                <option>FMCG</option>
                                <option>Hospitality</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Head Office Location</label>
                            <input className="form-control" placeholder="City, State"
                                value={company.headOfficeLocation} onChange={e => setCompany({ ...company, headOfficeLocation: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Procurement Regions (comma-separated)</label>
                            <input className="form-control" placeholder="Tamil Nadu, Andhra Pradesh"
                                value={company.procurementRegion} onChange={e => setCompany({ ...company, procurementRegion: e.target.value })} />
                        </div>
                        <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Complete Registration →'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="text-center" style={{ padding: '24px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
                        <h2 style={{ marginBottom: 8 }}>You're all set!</h2>
                        <p className="text-muted" style={{ marginBottom: 24 }}>Your buyer account is ready. Start posting crop requirements.</p>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
                    </div>
                )}

                {step === 0 && (
                    <p className="text-center mt-4 text-muted text-sm">
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
