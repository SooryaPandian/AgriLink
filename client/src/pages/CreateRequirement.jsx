import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Save, ArrowLeft } from "lucide-react";

const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40";
const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" };

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</label>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div className="rounded-2xl border p-6 mb-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
    <h3 className="font-bold text-base mb-5 text-green-500">{title}</h3>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

export default function CreateRequirement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cropName: "", variety: "", requiredQuantity: "", qualityGrade: "A",
    plantingDate: "", harvestDate: "", deliveryDate: "",
    targetRegion: "", allowedDistricts: "",
    minFarmSize: "", requiredCertifications: "", farmingPractices: "",
    initialPriceExpectation: "", negotiationAllowed: true,
    pickupOrDelivery: "pickup", transportResponsibility: "buyer",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        requiredQuantity: Number(form.requiredQuantity),
        minFarmSize: Number(form.minFarmSize) || undefined,
        initialPriceExpectation: Number(form.initialPriceExpectation) || undefined,
        allowedDistricts: form.allowedDistricts.split(",").map((s) => s.trim()).filter(Boolean),
        requiredCertifications: form.requiredCertifications.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await api.post("/buyers/requirements", payload);
      toast.success("Requirement posted successfully!");
      navigate("/requirements");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post requirement");
    } finally { setLoading(false); }
  };

  const selCls = `${inputCls} cursor-pointer`;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Post Crop Requirement</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Define what crop you need and connect with farmers</p>
        </div>
        <button onClick={() => navigate("/requirements")} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Section title="Crop Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Crop Name *"><input className={inputCls} style={inputStyle} required placeholder="e.g., Rice, Wheat" value={form.cropName} onChange={(e) => set("cropName", e.target.value)} /></Field>
            <Field label="Variety"><input className={inputCls} style={inputStyle} placeholder="e.g., Basmati" value={form.variety} onChange={(e) => set("variety", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Required Qty (Quintals) *"><input className={inputCls} style={inputStyle} type="number" required min={1} value={form.requiredQuantity} onChange={(e) => set("requiredQuantity", e.target.value)} /></Field>
            <Field label="Quality Grade">
              <select className={selCls} style={inputStyle} value={form.qualityGrade} onChange={(e) => set("qualityGrade", e.target.value)}>
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Commercial)</option>
                <option value="organic">Organic Certified</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Timeline">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Planting Date"><input className={inputCls} style={inputStyle} type="date" value={form.plantingDate} onChange={(e) => set("plantingDate", e.target.value)} /></Field>
            <Field label="Harvest Date"><input className={inputCls} style={inputStyle} type="date" value={form.harvestDate} onChange={(e) => set("harvestDate", e.target.value)} /></Field>
            <Field label="Delivery Date"><input className={inputCls} style={inputStyle} type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target Region"><input className={inputCls} style={inputStyle} placeholder="e.g., Tamil Nadu" value={form.targetRegion} onChange={(e) => set("targetRegion", e.target.value)} /></Field>
            <Field label="Allowed Districts (comma-separated)"><input className={inputCls} style={inputStyle} placeholder="Trichy, Salem, Erode" value={form.allowedDistricts} onChange={(e) => set("allowedDistricts", e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Contract Conditions">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Farm Size (Acres)"><input className={inputCls} style={inputStyle} type="number" min={0} value={form.minFarmSize} onChange={(e) => set("minFarmSize", e.target.value)} /></Field>
            <Field label="Required Certifications"><input className={inputCls} style={inputStyle} placeholder="Organic, GAP, ISO..." value={form.requiredCertifications} onChange={(e) => set("requiredCertifications", e.target.value)} /></Field>
          </div>
          <Field label="Farming Practices Notes">
            <textarea className={inputCls} style={inputStyle} rows={3} placeholder="Describe required farming practices..." value={form.farmingPractices} onChange={(e) => set("farmingPractices", e.target.value)} />
          </Field>
        </Section>

        <Section title="Price & Logistics">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expected Price (per quintal)"><input className={inputCls} style={inputStyle} type="number" min={0} value={form.initialPriceExpectation} onChange={(e) => set("initialPriceExpectation", e.target.value)} /></Field>
            <Field label="Negotiation">
              <select className={selCls} style={inputStyle} value={form.negotiationAllowed ? "yes" : "no"} onChange={(e) => set("negotiationAllowed", e.target.value === "yes")}>
                <option value="yes">Negotiation Allowed</option>
                <option value="no">Fixed Price</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pickup / Delivery">
              <select className={selCls} style={inputStyle} value={form.pickupOrDelivery} onChange={(e) => set("pickupOrDelivery", e.target.value)}>
                <option value="pickup">Pickup from Farm</option>
                <option value="delivery">Farmer Delivers</option>
                <option value="both">Both Options</option>
              </select>
            </Field>
            <Field label="Transport Responsibility">
              <select className={selCls} style={inputStyle} value={form.transportResponsibility} onChange={(e) => set("transportResponsibility", e.target.value)}>
                <option value="buyer">Buyer</option>
                <option value="farmer">Farmer</option>
                <option value="shared">Shared</option>
              </select>
            </Field>
          </div>
        </Section>

        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-900/30">
          {loading ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={18} />}
          {loading ? "Posting..." : "Post Requirement"}
        </button>
      </form>
    </div>
  );
}
