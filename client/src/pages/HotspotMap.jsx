/**
 * HotspotMap.jsx
 * ==============
 * Buyer-side crop hotspot discovery page.
 *
 * Flow:
 *  1. Buyer picks crop name (+ optional variety) from server-driven dropdowns.
 *  2. App calls GET /api/buyers/hotspots → returns village-level aggregated data.
 *  3. Map renders a CircleMarker per hotspot; radius ∝ sqrt(totalAcres).
 *  4. Side-panel lists every hotspot with yield/acre, total quintals, farm count
 *     and driving-distance proxy from a reference HQ location.
 *  5. "Send Requirement Here" pre-fills CreateRequirement with region/district.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Circle,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  MapPin,
  Search,
  Loader2,
  ChevronDown,
  Wheat,
  TrendingUp,
  BarChart2,
  Navigation,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

// Default reference HQ used for distance calculations.
// Coimbatore is a major agri-commodity hub close to Erode / Karur.
const DEFAULT_HQ = { lat: 11.0168, lng: 76.9558, label: "Coimbatore (default)" };

const MAP_CENTER = [11.15, 77.75]; // centroid of Erode + Karur combined
const MAP_ZOOM   = 9;
const YEAR       = 2025;

// ─────────────────────────────────────────────────────────────────────────────
//  Haversine Distance  (km)
// ─────────────────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Marker colour by yield intensity
// ─────────────────────────────────────────────────────────────────────────────
function yieldColor(avgYield, min, max) {
  if (max === min) return "#22c55e";
  const t = (avgYield - min) / (max - min); // 0 → 1
  // green (low) → amber (mid) → red-orange (high)
  if (t < 0.5) {
    const g = Math.round(194 + (197 - 194) * (t * 2));
    return `rgb(34,${g},94)`;
  }
  const r = Math.round(34 + (239 - 34) * ((t - 0.5) * 2));
  const g = Math.round(197 - (197 - 158) * ((t - 0.5) * 2));
  return `rgb(${r},${g},68)`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-component: fly map to selected hotspot
// ─────────────────────────────────────────────────────────────────────────────
function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 12, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared style helpers
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/40";
const inputStyle = {
  background: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--text)",
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function HotspotMap() {
  const navigate = useNavigate();

  // ── crop catalogue ──────────────────────────────────────────────────────
  const [catalogue, setCatalogue]   = useState([]); // [{cropName, varieties[], districts[]}]
  const [catLoading, setCatLoading] = useState(true);

  // ── search state ────────────────────────────────────────────────────────
  const [cropName,  setCropName]  = useState("");
  const [variety,   setVariety]   = useState("");
  const [district,  setDistrict]  = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState(0); // quintals
  const [proximityKm, setProximityKm] = useState(0); // km

  // ── results ─────────────────────────────────────────────────────────────
  const [hotspots,  setHotspots]  = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched,  setSearched]  = useState(false);

  // ── selection ───────────────────────────────────────────────────────────
  const [selected,  setSelected]  = useState(null); // hotspot object
  const listRefs   = useRef({});

  // ── buyer HQ / company ───────────────────────────────────────────────────
  const [hq, setHq] = useState(DEFAULT_HQ);
  const [companyName, setCompanyName] = useState("");

  // ── derived variety list from selected crop ──────────────────────────────
  const varieties = catalogue.find(
    (c) => c.cropName.toLowerCase() === cropName.toLowerCase()
  )?.varieties ?? [];

  // ── distinct districts from search results ───────────────────────────────
  const availableDistricts = [...new Set(
    catalogue.find((c) => c.cropName.toLowerCase() === cropName.toLowerCase())
      ?.districts ?? []
  )];

  // ── yield range for colour coding ────────────────────────────────────────
  const yieldValues  = hotspots.map((h) => h.avgYieldPerAcre);
  const yieldMin     = Math.min(...yieldValues, 0);
  const yieldMax     = Math.max(...yieldValues, 1);

  // ─────────────────────────────────────────────────────────────────────────
  //  Load crop catalogue on mount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
            {hotspots.map((h) => {
      try {
        const { data } = await api.get(`/buyers/hotspots/crops?year=${YEAR}`);
        if (data.success) setCatalogue(data.crops);
              // Compute a radius in meters so the circle represents real area and stays fixed relative to map zoom
              const color    = yieldColor(h.avgYieldPerAcre, yieldMin, yieldMax);
              let radiusMeters = 500; // default
              if (h.farmSpreadKm && h.farmSpreadKm > 0) {
                // farmSpreadKm is the diagonal approx; use half as radius (meters)
                radiusMeters = Math.max(300, (h.farmSpreadKm * 1000) / 2);
              } else if (h.totalAcres && h.totalAcres > 0) {
                // fallback: convert acres -> approximate circle radius
                const areaM2 = h.totalAcres * 4046.86;
                radiusMeters = Math.max(300, Math.sqrt(areaM2 / Math.PI));
              }
              const satisfies = !!h.satisfies;
        toast.error("Could not load crop list. Make sure the server is running.");
                <Circle
                  key={key}
                  center={[h.lat, h.lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color:       isActive ? "#ffffff" : (satisfies ? "#16a34a" : color),
                    fillColor:   color,
                    // reduce transparency = increase opacity
                    fillOpacity: isActive ? 0.98 : (satisfies ? 0.92 : 0.9),
                    weight:      isActive ? 3 : (satisfies ? 3 : 2),
                  }}
                  eventHandlers={{
                    click: () => handleSelectHotspot(h),
                  }}
                >
                  <Tooltip direction="top" opacity={0.95}>
        // Profile stores city/state as text; use fixed coords per known cities
        const CITY_COORDS = {
          coimbatore: { lat: 11.0168, lng: 76.9558 },
          erode:      { lat: 11.3410, lng: 77.7172 },
          karur:      { lat: 10.9601, lng: 78.0766 },
          salem:      { lat: 11.6643, lng: 78.1460 },
          tirupur:    { lat: 11.1085, lng: 77.3411 },
          chennai:    { lat: 13.0827, lng: 80.2707 },
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        <strong>Total:</strong> {h.totalQuintals?.toFixed(1) ?? '—'} q
                        &nbsp;·&nbsp;<strong>Spread:</strong> {h.farmSpreadKm?.toFixed(1) ?? '—'} km
                        &nbsp;·&nbsp;<strong>Radius:</strong> {Math.round(radiusMeters)} m
                      </div>
        if (match) {
          setHq({
            lat:   CITY_COORDS[match].lat,
            lng:   CITY_COORDS[match].lng,
            label: p.city,
                </Circle>
        }
      } catch {
        // silently fall back to DEFAULT_HQ
      }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  Search handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!cropName.trim()) {
      toast.error("Please select a crop first.");
      return;
    }
    setSearching(true);
    setSelected(null);
    try {
      const params = new URLSearchParams({ cropName, year: YEAR });
      if (variety.trim())  params.set("variety",  variety);
      if (district.trim()) params.set("district", district);
      if (Number(requiredQuantity) > 0) params.set("requiredQuantity", String(requiredQuantity));
      if (Number(proximityKm) > 0) params.set("proximityKm", String(proximityKm));

      const { data } = await api.get(`/buyers/hotspots?${params}`);
      if (!data.success) throw new Error(data.message);

      // Attach haversine distance from buyer HQ and filter invalid locations
      const withDist = (data.hotspots || []).map((h) => ({
        ...h,
        distanceKm: (typeof h.lat === 'number' && typeof h.lng === 'number') ? haversine(hq.lat, hq.lng, h.lat, h.lng) : Infinity,
      }));
      // Remove entries without valid coordinates
      const valid = withDist.filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng));
      const invalidCount = withDist.length - valid.length;
      if (invalidCount > 0) console.warn(`HotspotMap: filtered out ${invalidCount} hotspot(s) missing lat/lng`);
      // sort by distance asc
      valid.sort((a, b) => a.distanceKm - b.distanceKm);
      setHotspots(valid);
      setSearched(true);
      if (withDist.length === 0) {
        toast("No hotspots found for this crop/variety. Try a different combination.", { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }, [cropName, variety, district, hq, requiredQuantity, proximityKm]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Handle click on a list item (fly to + highlight)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectHotspot = (h) => {
    setSelected(h);
  };

  // Scroll list to selected item when map marker is clicked
  useEffect(() => {
    if (selected) {
      const key = `${selected.village}-${selected.district}`;
      listRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Navigate to CreateRequirement pre-filled with selected region
  // ─────────────────────────────────────────────────────────────────────────
  const sendRequirement = (h) => {
    navigate("/requirements/new", {
      state: {
        prefill: {
          cropName:       cropName,
          variety:        variety || (h.varieties?.[0] ?? ""),
          targetRegion:   `${h.village}, ${h.district}`,
          allowedDistricts: h.district,
        },
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  // Use viewport-based height so the map fills remaining screen space
    const CONTENT_HEIGHT = "calc(100vh - 120px)"; // increase available height

  return (
    <div className="flex flex-col" style={{ color: "var(--text)", height: CONTENT_HEIGHT }}>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <MapPin size={24} className="text-green-500" />
            Crop Hotspot Map
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Discover where crops are grown — search to view yield hotspots on the map
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <Navigation size={12} />
          HQ: {hq.label}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div
        className="rounded-2xl border p-4 mb-4 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap gap-3 items-end">
          {/* Crop name */}
          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Crop *
            </label>
            {catLoading ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <Loader2 size={13} className="animate-spin" /> Loading crops…
              </div>
            ) : (
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-8`}
                  style={inputStyle}
                  value={cropName}
                  onChange={(e) => { setCropName(e.target.value); setVariety(""); setDistrict(""); }}
                >
                  <option value="">— select crop —</option>
                  
                  {catalogue.map((c) => (
                    <option key={c.cropName} value={c.cropName}>{c.cropName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            )}
          </div>

          {/* Variety */}
          <div className="flex flex-col gap-1 min-w-[140px] flex-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Variety
            </label>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8`}
                style={inputStyle}
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                disabled={!cropName}
              >
                <option value="">All varieties</option>
                {varieties.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* District filter */}
          <div className="flex flex-col gap-1 min-w-[130px] flex-1">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              District
            </label>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8`}
                style={inputStyle}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!cropName}
              >
                <option value="">All districts</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* Required quantity (quintals) */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Required (q)
            </label>
            <input
              type="number"
              min={0}
              className={inputCls}
              style={inputStyle}
              value={requiredQuantity}
              onChange={(e) => setRequiredQuantity(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Proximity (km) */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Max spread (km)
            </label>
            <input
              type="number"
              min={0}
              className={inputCls}
              style={inputStyle}
              value={proximityKm}
              onChange={(e) => setProximityKm(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={searching || !cropName}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {searching ? "Searching…" : "Find Hotspots"}
          </button>

          {searched && (
            <button
              onClick={() => { setHotspots([]); setSearched(false); setSelected(null); setCropName(""); setVariety(""); setDistrict(""); setRequiredQuantity(0); setProximityKm(0); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:border-green-500/50 shrink-0"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Main content: map + list side-by-side ── */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ────── Left: results list ────── */}
        <div
          className="w-96 shrink-0 flex flex-col rounded-2xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* List header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="font-bold text-sm">
              Hotspot Regions
              {hotspots.length > 0 && (
                <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  {hotspots.length} found
                </span>
              )}
            </span>
            {hotspots.length > 0 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>sorted by distance</span>
            )}
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto">
            {!searched ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <Wheat size={40} className="text-green-500/40" />
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Select a crop and click <strong>Find Hotspots</strong> to see growing regions on the map.
                </p>
              </div>
            ) : hotspots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <Info size={36} className="text-amber-400/50" />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No historical data found for <strong>{cropName}</strong>
                  {variety ? ` (${variety})` : ""}.
                </p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {hotspots.map((h) => {
                  const key   = `${h.village}-${h.district}`;
                  const isSelected = selected && selected.village === h.village && selected.district === h.district;
                  const color = yieldColor(h.avgYieldPerAcre, yieldMin, yieldMax);
                  return (
                    <li
                      key={key}
                      ref={(el) => { listRefs.current[key] = el; }}
                      onClick={() => handleSelectHotspot(h)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-green-600/15 border-l-4 border-green-500" : "hover:bg-white/5 border-l-4 border-transparent"
                      }`}
                    >
                      {/* Row 1: village + district */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="font-bold text-sm">{h.village}</span>
                          <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                            {h.district}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {h.distanceKm.toFixed(0)} km
                          </span>
                          {h.satisfies && (
                            <span className="mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#16a34a", color: "white" }}>
                              Meets need
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: stats grid */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Stat icon={<TrendingUp size={11} />} label="Yield/Acre" value={`${h.avgYieldPerAcre.toFixed(1)} q`} color={color} />
                        <Stat icon={<BarChart2 size={11} />} label="Total Quintals" value={h.totalQuintals?.toFixed(0) ?? '—'} />
                        <Stat icon={<Wheat size={11} />} label="Farms" value={h.farmCount ?? '—'} />
                      </div>

                      {/* Row 3: varieties */}
                      {h.varieties?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {h.varieties.slice(0, 3).map((v) => (
                            <span key={v} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                              {v}
                            </span>
                          ))}
                          {h.varieties.length > 3 && (
                            <span className="text-xs" style={{ color: "var(--text-dim)" }}>+{h.varieties.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Row 4: CTA (only when selected) */}
                      {isSelected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); sendRequirement(h); }}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all"
                        >
                          Send Requirement to This Region <ArrowRight size={13} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ────── Right: map ────── */}
        <div className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)", minHeight: 0 }}>
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            style={{ height: "100%", width: "100%", minHeight: 520 }}
            zoomControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fly to selected hotspot */}
            {selected && <MapFlyTo target={selected} />}

            {/* Hotspot markers */}
            {hotspots.map((h) => {
              const key      = `${h.village}-${h.district}`;
              const isActive = selected && selected.village === h.village && selected.district === h.district;
              // Increase visual prominence: scale sqrt(totalAcres) with a larger multiplier
              const radius   = Math.max(10, Math.min(80, Math.sqrt(Math.max(1, h.totalAcres)) * 4));
              const color    = yieldColor(h.avgYieldPerAcre, yieldMin, yieldMax);
              const satisfies = !!h.satisfies;
              return (
                <CircleMarker
                  key={key}
                  center={[h.lat, h.lng]}
                  radius={radius}
                  pathOptions={{
                    color:       isActive ? "#ffffff" : (satisfies ? "#16a34a" : color),
                    fillColor:   color,
                    fillOpacity: isActive ? 0.95 : (satisfies ? 0.95 : 0.75),
                    weight:      isActive ? 3 : (satisfies ? 3 : 2),
                  }}
                  eventHandlers={{
                    click: () => handleSelectHotspot(h),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ fontWeight: 700 }}>{h.village}</div>
                      <div style={{ color: "#666", fontSize: 11 }}>{h.taluk} · {h.district}</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{h.avgYieldPerAcre.toFixed(1)} q/acre</span>
                        &nbsp;·&nbsp;{h.totalAcres.toFixed(0)} acres
                        &nbsp;·&nbsp;{h.farmCount} farms
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        <strong>Total:</strong> {h.totalQuintals?.toFixed(1) ?? '—'} q
                        &nbsp;·&nbsp;<strong>Spread:</strong> {h.farmSpreadKm?.toFixed(1) ?? '—'} km
                      </div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {h.distanceKm.toFixed(0)} km from HQ
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* ── Legend ── */}
      {hotspots.length > 0 && (
        <div
          className="mt-3 shrink-0 flex items-center gap-6 px-4 py-2 rounded-xl border text-xs"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span className="font-semibold">Legend:</span>
          <LegendDot color="#22c55e" label="Lower yield/acre" />
          <LegendDot color="#eab308" label="Medium yield/acre" />
          <LegendDot color="#f97316" label="Higher yield/acre" />
          <span className="ml-auto">Circle size = total acres cultivated</span>
        </div>
      )}
      {/* Company name display (if available) */}
      <div style={{ height: 8 }} />
      {companyName && (
        <div className="text-xs text-right" style={{ color: "var(--text-muted)", marginTop: 6 }}>
          Company: {companyName}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Small reusable subcomponents
// ─────────────────────────────────────────────────────────────────────────────
function Stat({ icon, label, value, color }) {
  return (
    <div
      className="flex flex-col items-center rounded-lg px-1 py-1.5"
      style={{ background: "var(--bg)" }}
    >
      <span className="flex items-center gap-0.5 mb-0.5" style={{ color: color ?? "var(--text-muted)" }}>
        {icon}
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      </span>
      <span className="text-xs font-bold" style={{ color: color ?? "var(--text)" }}>{value}</span>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full inline-block border border-white/20"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
