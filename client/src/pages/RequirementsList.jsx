import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Plus, Search, Eye, Play, Sprout } from "lucide-react";
import toast from "react-hot-toast";

const BADGE = {
  open: "bg-green-500/15 text-green-400",
  negotiating: "bg-amber-500/15 text-amber-400",
  contracts_allocated: "bg-blue-500/15 text-blue-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function RequirementsList() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/buyers/requirements")
      .then((r) => setRequirements(r.data.requirements))
      .finally(() => setLoading(false));
  }, []);

  const filtered = requirements.filter(
    (r) =>
      r.cropName?.toLowerCase().includes(search.toLowerCase()) ||
      r.targetRegion?.toLowerCase().includes(search.toLowerCase())
  );

  const startNegotiation = async (id) => {
    try {
      await api.post(`/negotiation/${id}/start`);
      toast.success("Negotiation session started!");
      navigate(`/requirements/${id}/negotiate`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start negotiation");
    }
  };

  return (
    <div>
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>My Requirements</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Manage your posted crop requirements and track applications
          </p>
        </div>
        <Link
          to="/requirements/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30 text-sm"
        >
          <Plus size={16} /> Post New
        </Link>
      </div>

      {/* â”€â”€ Search â”€â”€ */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
        <input
          placeholder="Search by crop or region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
        />
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border flex flex-col items-center py-20" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <Sprout size={48} className="mb-4 opacity-30" style={{ color: "var(--text-dim)" }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>No requirements found</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Post your first crop requirement to connect with farmers.
          </p>
          <Link
            to="/requirements/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30 text-sm"
          >
            <Plus size={16} /> Post Requirement
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                  {["Crop", "Qty (q)", "Region", "Price/Q", "Apps", "Status", "Posted", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r._id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{r.cropName}</div>
                      <div className="text-xs" style={{ color: "var(--text-dim)" }}>{r.variety}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text)" }}>{r.requiredQuantity}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{r.targetRegion || "â€”"}</td>
                    <td className="px-4 py-3 font-semibold text-amber-500">&#8377;{r.initialPriceExpectation || "â€“"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${r.applicationCount > 0 ? "text-green-500" : ""}`}
                        style={r.applicationCount === 0 ? { color: "var(--text-dim)" } : {}}
                      >
                        {r.applicationCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[r.status] || "bg-slate-500/15 text-slate-400"}`}>
                        {r.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-dim)" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/requirements/${r._id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:border-green-500/50"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          <Eye size={13} /> View
                        </Link>
                        {r.status === "open" && r.applicationCount > 0 && (
                          <button
                            onClick={() => startNegotiation(r._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all"
                          >
                            <Play size={13} /> Negotiate
                          </button>
                        )}
                        {r.status === "negotiating" && (
                          <Link
                            to={`/requirements/${r._id}/negotiate`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
                          >
                            <Play size={13} /> Continue
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

