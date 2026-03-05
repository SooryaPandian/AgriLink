import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Sprout, Users, TrendingUp, FileCheck, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BADGE = { open: "bg-green-500/15 text-green-400", negotiating: "bg-amber-500/15 text-amber-400", contracts_allocated: "bg-blue-500/15 text-blue-400", fulfilled: "bg-emerald-500/15 text-emerald-400", cancelled: "bg-red-500/15 text-red-400" };

const StatCard = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="rounded-2xl border p-5 flex items-start gap-4 transition-all hover:scale-[1.01]" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${gradient}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <div className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{sub}</div>}
    </div>
  </div>
);

const MOCK_TREND = [
  { round: "Initial", price: 2400 },
  { round: "Round 1", price: 2200 },
  { round: "Round 2", price: 2050 },
  { round: "Final", price: 1950 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/buyers/dashboard"), api.get("/buyers/requirements")])
      .then(([a, r]) => {
        setAnalytics(a.data.analytics);
        setRequirements(r.data.requirements.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );

  const { totalRequirements = 0, openRequirements = 0, totalApplications = 0,
    averageFarmerPrice = 0, totalContracts = 0, acceptedContracts = 0, fulfilmentRate = 0 } = analytics || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Welcome back, <span className="font-semibold text-green-500">{user?.name}</span></p>
        </div>
        <Link to="/requirements/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30 text-sm">
          <Plus size={16} /> Post Requirement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Sprout}    label="Total Requirements" value={totalRequirements} sub={`${openRequirements} open`} gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
        <StatCard icon={Users}     label="Total Applications" value={totalApplications} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard icon={TrendingUp} label="Avg. Farmer Price" value={`₹${averageFarmerPrice}/q`} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard icon={FileCheck} label="Contract Rate" value={`${fulfilmentRate}%`} sub={`${acceptedContracts}/${totalContracts} accepted`} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
      </div>

      {/* Charts + Recents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-1" style={{ color: "var(--text)" }}>Negotiation Price Trend</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Sample price trajectory across rounds</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MOCK_TREND}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="round" stroke="var(--text-dim)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v) => [`₹${v}`, "Price"]} />
              <Area type="monotone" dataKey="price" stroke="#16a34a" fill="url(#pGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recents */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: "var(--text)" }}>Recent Requirements</h3>
            <Link to="/requirements" className="flex items-center gap-1 text-xs font-semibold text-green-500 hover:text-green-400">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          {requirements.length === 0 ? (
            <div className="flex flex-col items-center py-10" style={{ color: "var(--text-dim)" }}>
              <Sprout size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No requirements yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {requirements.map((r) => (
                <Link key={r._id} to={`/requirements/${r._id}`} className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {r.cropName} <span className="font-normal text-xs" style={{ color: "var(--text-dim)" }}>({r.variety})</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{r.requiredQuantity} q � {r.targetRegion}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[r.status] || "bg-slate-500/15 text-slate-400"}`}>
                    {r.status?.replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
