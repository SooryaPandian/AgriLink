/**
 * Rough logistics cost estimator for India.
 * Uses a state-to-state distance tier matrix (km buckets) and a
 * standard road-freight rate of ~₹2–4 per quintal per 100 km.
 *
 * Returns:
 *   { ratePerQuintal, estimatedTotal, tier, note }
 */

// Approximate straight-line distance (km) between major Indian state capitals.
// Symmetric pairs are stored once (lower key first alphabetically).
const STATE_DIST_KM = {
  "andhra pradesh": {
    telangana: 270,
    karnataka: 570,
    "tamil nadu": 510,
    odisha: 760,
    chhattisgarh: 800,
  },
  assam: { "west bengal": 660, manipur: 510, nagaland: 340, meghalaya: 180 },
  bihar: {
    jharkhand: 320,
    "uttar pradesh": 480,
    "west bengal": 600,
    odisha: 620,
  },
  chhattisgarh: {
    "madhya pradesh": 340,
    odisha: 450,
    jharkhand: 400,
    telangana: 640,
  },
  delhi: {
    haryana: 140,
    "uttar pradesh": 200,
    rajasthan: 270,
    punjab: 300,
    "himachal pradesh": 330,
  },
  gujarat: { rajasthan: 380, "madhya pradesh": 510, maharashtra: 490 },
  haryana: {
    punjab: 220,
    rajasthan: 320,
    "uttar pradesh": 350,
    "himachal pradesh": 240,
  },
  jharkhand: { "west bengal": 420, odisha: 380, bihar: 320 },
  karnataka: {
    "tamil nadu": 360,
    kerala: 490,
    goa: 420,
    telangana: 560,
    "andhra pradesh": 570,
  },
  kerala: { "tamil nadu": 680, karnataka: 490 },
  "madhya pradesh": {
    "uttar pradesh": 450,
    rajasthan: 470,
    gujarat: 510,
    maharashtra: 560,
    chhattisgarh: 340,
  },
  maharashtra: {
    karnataka: 550,
    goa: 510,
    telangana: 620,
    gujarat: 490,
    "madhya pradesh": 560,
  },
  odisha: {
    "west bengal": 460,
    jharkhand: 380,
    chhattisgarh: 450,
    "andhra pradesh": 760,
  },
  punjab: { haryana: 220, "himachal pradesh": 200, rajasthan: 490 },
  rajasthan: { gujarat: 380, "madhya pradesh": 470, "uttar pradesh": 560 },
  "tamil nadu": {
    "andhra pradesh": 510,
    karnataka: 360,
    kerala: 680,
    puducherry: 150,
  },
  telangana: {
    "andhra pradesh": 270,
    karnataka: 560,
    maharashtra: 620,
    chhattisgarh: 640,
  },
  "uttar pradesh": {
    bihar: 480,
    "madhya pradesh": 450,
    rajasthan: 560,
    delhi: 200,
  },
  "west bengal": { odisha: 460, jharkhand: 420, bihar: 600, assam: 660 },
};

// Freight rate tiers (₹ per quintal)
const TIERS = [
  { maxKm: 0, label: "Same location", rate: 8 },
  { maxKm: 150, label: "Very short", rate: 15 },
  { maxKm: 350, label: "Short haul", rate: 25 },
  { maxKm: 600, label: "Medium haul", rate: 40 },
  { maxKm: 900, label: "Long haul", rate: 60 },
  { maxKm: Infinity, label: "Very long haul", rate: 80 },
];

function normalise(s = "") {
  return s.trim().toLowerCase();
}

function getDistanceKm(stateA, stateB) {
  const a = normalise(stateA);
  const b = normalise(stateB);
  if (a === b) return 0;

  // Try direct lookup
  if (STATE_DIST_KM[a]?.[b] !== undefined) return STATE_DIST_KM[a][b];
  if (STATE_DIST_KM[b]?.[a] !== undefined) return STATE_DIST_KM[b][a];

  // Default fallback for unknown state pairs
  return 900;
}

/**
 * @param {string} buyerState  - e.g. "Tamil Nadu"
 * @param {string} farmerState - e.g. "Andhra Pradesh"
 * @param {number} quantityQ   - quantity in quintals
 * @returns {{ distKm, tier, ratePerQuintal, estimatedTotal, note }}
 */
function estimateLogistics(buyerState, farmerState, quantityQ = 1) {
  const distKm = getDistanceKm(buyerState, farmerState);
  const tier = TIERS.find((t) => distKm <= t.maxKm) || TIERS[TIERS.length - 1];

  const ratePerQuintal = tier.rate;
  const estimatedTotal = Math.round(ratePerQuintal * quantityQ);

  return {
    distKm,
    tier: tier.label,
    ratePerQuintal,
    estimatedTotal,
    note: `Rough estimate based on ${tier.label.toLowerCase()} road freight (~${distKm} km). Actual costs vary by carrier and route.`,
  };
}

module.exports = { estimateLogistics };
