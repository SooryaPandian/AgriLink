import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, Users, MapPin, Calendar } from "lucide-react";

const STATUS_BADGE = { pending: "bg-slate-500/15 text-slate-400", in_negotiation: "bg-amber-500/15 text-amber-400", contract_offered: "bg-blue-500/15 text-blue-400", contracted: "bg-green-500/15 text-green-400", rejected: "bg-red-500/15 text-red-400" };
const REQ_BADGE = { open: "bg-green-500/15 text-green-400", negotiating: "bg-amber-500/15 text-amber-400", contracts_allocated: "bg-blue-500/15 text-blue-400" };

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-green-800 border-t-green-500 animate-spin" />
    </div>
  );
  if (!requirement) return <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Not found</h1>;

  const avgPrice = applications.length
    ? (applications.reduce((s, a) => s + a.expectedPrice, 0) / applications.length).toFixed(0) : "�";
  const lowestPrice = applications.length ? Math.min(...applications.map((a) => a.expectedPrice)) : "�";

  const InfoCell = ({ k, v }) => (
    <div className="p-3 rounded-xl border" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-dim)" }}>{k}</div>
      <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{v}</div>
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <Link to="/requirements" className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all hover:border-green-500/50" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Main info */}
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{requirement.cropName}</h1>
              {requirement.variety && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Variety: {requirement.variety}</p>}
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${REQ_BADGE[requirement.status] || "bg-slate-500/15 text-slate-400"}`}>
              {requirement.status?.replace(/_/g, " ")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <InfoCell k="Required Qty" v={`${requirement.requiredQuantity} quintals`} />
            <InfoCell k="Quality Grade" v={requirement.qualityGrade || "�"} />
            <InfoCell k="Expected Price" v={requirement.initialPriceExpectation ? `₹${requirement.initialPriceExpectation}/q` : "–"} />
            <InfoCell k="Negotiation" v={requirement.negotiationAllowed ? "Allowed" : "Fixed Price"} />
            <InfoCell k="Transport" v={requirement.transportResponsibility} />
            <InfoCell k="Pickup/Delivery" v={requirement.pickupOrDelivery} />
          </div>
          {requirement.status === "open" && applications.length > 0 && (
            <Link to={`/requirements/${id}/negotiate`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-900/30">
              Start Negotiation
            </Link>
          )}
          {requirement.status === "negotiating" && (
            <Link to={`/requirements/${id}/negotiate`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-900/30">
              Continue Negotiation
            </Link>
          )}
        </div>

        {/* Side */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="font-bold mb-3" style={{ color: "var(--text)" }}>Location & Timeline</h3>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <div className="flex items-center gap-2"><MapPin size={15} className="text-green-500 shrink-0" /><span>{requirement.targetRegion || "�"}</span></div>
              {requirement.allowedDistricts?.length > 0 && <div className="text-xs pl-5" style={{ color: "var(--text-dim)" }}>Districts: {requirement.allowedDistricts.join(", ")}</div>}
              {requirement.deliveryDate && (
                <div className="flex items-center gap-2"><Calendar size={15} className="text-amber-500 shrink-0" /><span>Delivery: {new Date(requirement.deliveryDate).toLocaleDateString()}</span></div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Applicants", value: applications.length, color: "text-green-500" },
                { label: "Avg. Price/Q", value: `₹${avgPrice}`, color: "text-amber-500" },
                { label: "Lowest ₹/Q",   value: lowestPrice === "–" ? "–" : `₹${lowestPrice}`, color: "text-blue-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applications table */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h2 className="font-bold text-lg mb-5" style={{ color: "var(--text)" }}>Farmer Applications ({applications.length})</h2>
        {applications.length === 0 ? (
          <div className="flex flex-col items-center py-12" style={{ color: "var(--text-dim)" }}>
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Farmer", "District/State", "Land (acres)", "Capacity (q)", "Est. Qty (q)", "Price/Q", "Rating", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((a, i) => (
                  <tr key={a._id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg)" }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{a.farmer?.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-dim)" }}>{a.farmer?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{a.farmerProfile?.district || "�"}, {a.farmerProfile?.state || "�"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{a.availableLandArea}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{a.cropProductionCapacity}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{a.estimatedProductionQuantity}</td>
                    <td className="px-4 py-3 font-bold text-amber-500">₹{a.expectedPrice}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{a.farmerProfile?.rating ? `★ ${a.farmerProfile.rating}` : "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[a.status] || "bg-slate-500/15 text-slate-400"}`}>
                        {a.status?.replace(/_/g, " ")}
                      </span>
                    </td>
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
