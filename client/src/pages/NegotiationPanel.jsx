import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function NegotiationPanel() {
  const { id: requirementId } = useParams();
  const [session, setSession] = useState(null);
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counterPrice, setCounterPrice] = useState("");
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      api.get(`/negotiation/${requirementId}`),
      api.get(`/buyers/requirements/${requirementId}`),
    ]).then(([n, r]) => {
      setSession(n.data.session);
      setRequirement(r.data.requirement);
    }).finally(() => setLoading(false));
  }, [requirementId]);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    socket.on("negotiation_update", fetchData);
    return () => socket.off("negotiation_update", fetchData);
  }, [fetchData]);

  const buyerAction = async (action) => {
    if (action === "counter" && (!counterPrice || isNaN(Number(counterPrice)))) {
      toast.error("Enter a valid counter price"); return;
    }
    setActing(true);
    try {
      const payload = { action };
      if (action === "counter") { payload.counterPrice = Number(counterPrice); payload.note = note; }
      const { data } = await api.post(`/negotiation/${requirementId}/buyer-action`, payload);
      setSession(data.session);
      toast.success(action === "accept" ? "Price accepted! Contracts being allocated." : "Counter offer sent to all farmers.");
      setCounterPrice(""); setNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally { setActing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );
  if (!session) return (
    <div>
      <Link to={`/requirements/${requirementId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border mb-5 transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <ArrowLeft size={15} /> Back
      </Link>
      <div className="rounded-2xl border p-12 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>No negotiation session found</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start negotiation from the requirement page if there are applications.</p>
      </div>
    </div>
  );

  const currentRound = session?.rounds?.[session.currentRound - 1];
  const priceHistory = session.rounds.map((r) => ({ round: `R${r.roundNumber}`, price: r.proposedPrice, counter: r.buyerCounterPrice }));

  const statusInfo = {
    buyer_review:   { label: "Awaiting Your Decision",    pill: "bg-amber-500/15 text-amber-400" },
    farmer_review:  { label: "Farmers Reviewing Counter",  pill: "bg-blue-500/15 text-blue-400" },
    agreed:         { label: "Price Agreed",               pill: "bg-green-500/15 text-green-400" },
    open:           { label: "Open",                       pill: "bg-emerald-500/15 text-emerald-400" },
    closed:         { label: "Closed",                     pill: "bg-slate-500/15 text-slate-400" },
  };
  const si = statusInfo[session.status] || statusInfo.open;

  const inputCls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40";
  const inputStyle = { background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" };

  return (
    <div>
      <div className="mb-5">
        <Link to={`/requirements/${requirementId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <ArrowLeft size={15} /> Back to Requirement
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Negotiation � {requirement?.cropName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Round {session.currentRound}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${si.pill}`}>{si.label}</span>
          </div>
        </div>
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Optimal Price", value: `₹${session.optimalPrice || "–"}/q`, color: "text-green-500" },
          { label: "Mean Price",    value: `₹${session.meanPrice || "–"}/q`,    color: "text-blue-500" },
          { label: "Median Price",  value: `₹${session.medianPrice || "–"}/q`,  color: "text-amber-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border p-5 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            <div className="text-xs mt-1 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Chart */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Price Trajectory</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="round" stroke="var(--text-dim)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v, n) => [`₹${v}`, n === "price" ? "Optimal" : "Counter"]} />
              <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a" }} name="price" />
              <Line type="monotone" dataKey="counter" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#f59e0b" }} name="counter" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Farmer responses */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Round {session.currentRound} � Farmer Responses</h3>
          {!currentRound?.farmerResponses?.length ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No farmer responses yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {currentRound.farmerResponses.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.farmer?.name || `Farmer ${i + 1}`}</span>
                  <div className="flex items-center gap-2">
                    {r.action === "accepted" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">Accepted</span>}
                    {r.action === "countered" && (
                      <>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">Counter</span>
                        <span className="text-sm font-bold text-amber-500">₹{r.counterPrice}</span>
                      </>
                    )}
                    {r.action === "pending" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400">Pending</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buyer action */}
      {session.status === "buyer_review" && (
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>Your Action &mdash; Round {session.currentRound}</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            System proposed optimal price: <strong className="text-green-500">₹{currentRound?.proposedPrice}/quintal</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Counter Price (₹/quintal)</label>
              <input className={inputCls} style={inputStyle} type="number" placeholder="Enter counter offer..." value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Note to farmers (optional)</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g., Price is final due to market rates..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled={acting} onClick={() => buyerAction("accept")} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-900/30">
              <CheckCircle size={18} /> Accept ?{currentRound?.proposedPrice}/q
            </button>
            <button disabled={acting} onClick={() => buyerAction("counter")} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50">
              Send Counter Offer
            </button>
            <Link to={`/chat/${session._id}`} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              <MessageSquare size={16} /> Open Chat
            </Link>
          </div>
        </div>
      )}

      {session.status === "agreed" && (
        <div className="rounded-2xl border-2 border-green-500/40 bg-green-500/5 p-12 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Price Agreed at ₹{session.finalAgreedPrice}/quintal</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Contracts have been allocated to qualifying farmers. Check the Contracts page.</p>
          <Link to="/contracts" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30">
            View Contracts
          </Link>
        </div>
      )}

      {session.status === "farmer_review" && (
        <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-10 text-center">
          <div className="text-4xl mb-3">?</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Waiting for farmers to respond</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Counter offer of ?{currentRound?.buyerCounterPrice}/q has been sent. Check back soon or refresh.</p>
          <Link to={`/chat/${session._id}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:border-blue-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <MessageSquare size={16} /> Open Chat
          </Link>
        </div>
      )}
    </div>
  );
}
