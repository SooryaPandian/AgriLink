import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FileCheck, Clock, CheckCircle, XCircle } from "lucide-react";

const BADGE = { invited: "bg-amber-500/15 text-amber-400", accepted: "bg-green-500/15 text-green-400", rejected: "bg-red-500/15 text-red-400", expired: "bg-slate-500/15 text-slate-400", fulfilled: "bg-emerald-500/15 text-emerald-400" };
const ICON = { invited: Clock, accepted: CheckCircle, rejected: XCircle, fulfilled: FileCheck };
const TABS = ["contracts", "invited", "accepted", "rejected"];

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("contracts");

  useEffect(() => {
    api.get("/contracts").then((r) => setContracts(r.data.contracts)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );

  const byStatus = (s) => contracts.filter((c) => c.status === s);
  const displayed = tab === "contracts" ? contracts : byStatus(tab);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Contract Management</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>View allocated contracts and waiting list farmers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => {
          const count = t === "contracts" ? contracts.length : byStatus(t).length;
          return (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${tab === t ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-900/30" : "border-transparent hover:border-green-500/30"}`} style={tab !== t ? { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" } : {}}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-2 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border flex flex-col items-center py-20" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <FileCheck size={48} className="mb-4 opacity-30" style={{ color: "var(--text-dim)" }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>No contracts yet</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Contracts appear here after you finalize a negotiation.</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border flex flex-col items-center py-16" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No {tab} contracts.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  {["Crop", "Farmer", "Agreed Price", "Quantity", "Delivery", "Invited At", "Status", "Chat"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((c, i) => {
                  const Icon = ICON[c.status] || Clock;
                  return (
                    <tr key={c._id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)" }}>
                      <td className="px-4 py-3">
                        <div className="font-semibold" style={{ color: "var(--text)" }}>{c.requirement?.cropName}</div>
                        <div className="text-xs" style={{ color: "var(--text-dim)" }}>{c.requirement?.variety}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold" style={{ color: "var(--text)" }}>{c.farmer?.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-dim)" }}>{c.farmer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-amber-500">₹{c.agreedPrice}/q</td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{c.contractedQuantity} q</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{c.deliveryDate ? new Date(c.deliveryDate).toLocaleDateString() : "�"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-dim)" }}>{new Date(c.invitedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[c.status] || "bg-slate-500/15 text-slate-400"}`}>
                          <Icon size={10} /> {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.requirement?.negotiationSession && (
                          <Link to={`/chat/${c.requirement.negotiationSession}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                            Chat
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
