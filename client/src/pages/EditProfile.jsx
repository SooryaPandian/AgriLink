import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Save, Building2, MapPin, User, Globe } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Puducherry","Jammu and Kashmir","Ladakh",
];

const INDUSTRY_TYPES = [
  "Food Processing","Export","Retail","FMCG","Hospitality","Flour Mill","Rice Mill","Oil Mill","Other",
];

const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40";
const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" };

const Field = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</label>
    {children}
    {hint && <p className="text-xs" style={{ color: "var(--text-dim)" }}>{hint}</p>}
  </div>
);

const Section = ({ icon: Icon, title, color = "text-green-500", children }) => (
  <div className="rounded-2xl border p-6 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={18} className={color} />
      <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
    {children}
  </div>
);

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: "", registrationNumber: "", gstin: "", industryType: "", website: "",
    contactPerson: "", annualRequirement: "",
    address: "", city: "", state: "", pincode: "",
    procurementRegion: "",
  });

  useEffect(() => {
    api.get("/buyers/profile").then((r) => {
      const p = r.data.profile || {};
      setForm({
        companyName:         p.companyName || "",
        registrationNumber:  p.registrationNumber || "",
        gstin:               p.gstin || "",
        industryType:        p.industryType || "",
        website:             p.website || "",
        contactPerson:       p.contactPerson || "",
        annualRequirement:   p.annualRequirement || "",
        address:             p.address || "",
        city:                p.city || "",
        state:               p.state || "",
        pincode:             p.pincode || "",
        procurementRegion:   Array.isArray(p.procurementRegion)
                               ? p.procurementRegion.join(", ")
                               : (p.procurementRegion || ""),
      });
    }).catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        annualRequirement: form.annualRequirement ? Number(form.annualRequirement) : undefined,
        procurementRegion: form.procurementRegion.split(",").map((s) => s.trim()).filter(Boolean),
      };
      await api.put("/buyers/profile", payload);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Company Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-dim)" }}>Used for logistics estimates and contract matching</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Company Info */}
        <Section icon={Building2} title="Company Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name *">
              <input className={inputCls} style={inputStyle} required placeholder="Acme Agro Pvt Ltd" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="CIN / Reg. Number">
              <input className={inputCls} style={inputStyle} placeholder="U01234MH2020PTC" value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GSTIN">
              <input className={inputCls} style={inputStyle} placeholder="27AAAAA0000A1Z5" value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
            </Field>
            <Field label="Industry Type">
              <select className={inputCls} style={{ ...inputStyle, cursor: "pointer" }} value={form.industryType} onChange={(e) => set("industryType", e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRY_TYPES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Annual Requirement (quintals)">
              <input className={inputCls} style={inputStyle} type="number" min={0} placeholder="e.g. 5000" value={form.annualRequirement} onChange={(e) => set("annualRequirement", e.target.value)} />
            </Field>
            <Field label="Contact Person">
              <input className={inputCls} style={inputStyle} placeholder="Procurement Manager Name" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section icon={MapPin} title="Head Office Location" color="text-amber-500">
          <div className="rounded-xl px-3 py-2 text-xs border border-amber-500/20 bg-amber-500/10 text-amber-400">
            Your state is used to calculate rough logistics costs when reviewing farmer applications.
          </div>
          <Field label="Street / Building Address">
            <input className={inputCls} style={inputStyle} placeholder="Plot 12, MIDC Industrial Area" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City *">
              <input className={inputCls} style={inputStyle} placeholder="Mumbai" required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Pincode">
              <input className={inputCls} style={inputStyle} placeholder="400001" maxLength={6} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </Field>
          </div>
          <Field label="State *">
            <select className={inputCls} style={{ ...inputStyle, cursor: "pointer" }} required value={form.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </Section>

        {/* Procurement */}
        <Section icon={Globe} title="Procurement Details" color="text-blue-500">
          <Field label="Procurement Regions (comma-separated)" hint="States / regions where you source from">
            <input className={inputCls} style={inputStyle} placeholder="Tamil Nadu, Andhra Pradesh, Karnataka" value={form.procurementRegion} onChange={(e) => set("procurementRegion", e.target.value)} />
          </Field>
          <Field label="Company Website">
            <input className={inputCls} style={inputStyle} placeholder="https://yourcompany.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-900/30"
        >
          {saving ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
