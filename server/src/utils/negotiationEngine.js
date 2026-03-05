/**
 * Negotiation Engine
 * Calculates optimal price from farmer expected prices using statistical methods.
 */

/**
 * Calculate mean of an array
 */
function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate median of an array
 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Remove outliers using IQR method
 */
function removeOutliers(values) {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.floor((3 * sorted.length) / 4)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= lower && v <= upper);
}

/**
 * Calculate optimal negotiation price from an array of farmer expected prices.
 * Returns { mean, median, optimalPrice, filteredPrices }
 */
function calculateOptimalPrice(prices) {
  if (!prices || prices.length === 0) throw new Error('No prices provided');

  const filteredPrices = removeOutliers(prices);
  const meanVal = parseFloat(mean(filteredPrices).toFixed(2));
  const medianVal = parseFloat(median(filteredPrices).toFixed(2));
  // Optimal = weighted average: 60% median + 40% mean (median is more robust)
  const optimalPrice = parseFloat((0.6 * medianVal + 0.4 * meanVal).toFixed(2));

  return { mean: meanVal, median: medianVal, optimalPrice, filteredPrices };
}

/**
 * Calculate a new optimal price after farmers submit re-negotiation prices.
 * Considers farmers who accepted the current price too (use buyer counter price for those who accepted).
 */
function recalculateAfterFarmerRound(farmerResponses, buyerCounterPrice) {
  const prices = farmerResponses.map((r) => {
    if (r.action === 'accepted') return buyerCounterPrice;
    return r.counterPrice || buyerCounterPrice;
  });
  return calculateOptimalPrice(prices);
}

module.exports = { calculateOptimalPrice, recalculateAfterFarmerRound, mean, median, removeOutliers };
