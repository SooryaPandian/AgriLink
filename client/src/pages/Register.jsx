import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Check, Sun, Moon } from "lucide-react";

const STEPS = ["Account", "Company", "Done"];

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40";
const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" };

export default function Register() {
  const { register } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState({ name: "", email: "", password: "", phone: "" });
  const [company, setCompany] = useState({ companyName: "", registrationNumber: "", industryType: "", headOfficeLocation: "", procurementRegion: "" });

  const isDark = theme === "dark";

  const handleAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...account, role: "buyer" });
      setStep(1);
      toast.success("Account created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...company,
        procurementRegion: company.procurementRegion.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await api.put("/buyers/profile", payload);
      setStep(2);
      toast.success("Company profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save profile");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-10" style={{ background: "var(--bg)" }}>
      <div className="absolute top-0 left-0 w-72 h-72 bg-green-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <button onClick={toggle} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
        {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-sky-500" />}
      </button>

      <div className="w-full max-w-lg z-10">
        <div className="rounded-2xl border p-8 shadow-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 mb-1 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg shadow-green-900/40">
              <Sprout size={28} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-green-500 to-amber-500 bg-clip-text text-transparent">AgriLink</span>
            <h1 className="mt-2 text-xl font-bold" style={{ color: "var(--text)" }}>Register as Buyer</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create your company account to post requirements</p>
          </div>

          {/* Steps */}
          <div className="flex items-center mb-8">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? "bg-green-500 text-white" : i === step ? "bg-green-600 text-white ring-4 ring-green-500/30" : "border-2 text-slate-400"
                  }`} style={i > step ? { borderColor: "var(--border)", color: "var(--text-dim)" } : {}}>
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  <span className="text-xs font-medium" style={{ color: i === step ? "var(--text)" : "var(--text-dim)" }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded" style={{ background: i < step ? "#16a34a" : "var(--border)" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {step === 0 && (
            <form onSubmit={handleAccount} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input className={inputCls} style={inputStyle} placeholder="Your name" required value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} style={inputStyle} placeholder="+91 90000 00000" required value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Email">
                <input className={inputCls} style={inputStyle} type="email" placeholder="you@company.com" required value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              </Field>
              <Field label="Password">
                <input className={inputCls} style={inputStyle} type="password" placeholder="Min 6 characters" minLength={6} required value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
              </Field>
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full py-3 mt-1 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-900/30">
                {loading ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
                {loading ? "Creating..." : "Continue ?"}
              </button>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleCompany} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name">
                  <input className={inputCls} style={inputStyle} placeholder="Acme Agro Pvt Ltd" required value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} />
                </Field>
                <Field label="Reg. Number">
                  <input className={inputCls} style={inputStyle} placeholder="CIN/GSTIN" value={company.registrationNumber} onChange={(e) => setCompany({ ...company, registrationNumber: e.target.value })} />
                </Field>
              </div>
              <Field label="Industry Type">
                <select className={inputCls} style={{ ...inputStyle, cursor: "pointer" }} value={company.industryType} onChange={(e) => setCompany({ ...company, industryType: e.target.value })}>
                  <option value="">Select industry</option>
                  {["Food Processing", "Export", "Retail", "FMCG", "Hospitality", "Other"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Head Office Location">
                <input className={inputCls} style={inputStyle} placeholder="City, State" value={company.headOfficeLocation} onChange={(e) => setCompany({ ...company, headOfficeLocation: e.target.value })} />
              </Field>
              <Field label="Procurement Regions (comma-separated)">
                <input className={inputCls} style={inputStyle} placeholder="Tamil Nadu, Andhra Pradesh" value={company.procurementRegion} onChange={(e) => setCompany({ ...company, procurementRegion: e.target.value })} />
              </Field>
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full py-3 mt-1 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-900/30">
                {loading ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
                {loading ? "Saving..." : "Complete Registration ?"}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg shadow-green-900/40">
                <Check size={40} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>You&apos;re all set!</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Your buyer account is ready. Start posting crop requirements.</p>
              <button onClick={() => navigate("/dashboard")} className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30">
                Go to Dashboard
              </button>
            </div>
          )}

          {step === 0 && (
            <p className="text-center mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
              Already have an account? <Link to="/login" className="font-semibold text-green-500 hover:text-green-400">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
