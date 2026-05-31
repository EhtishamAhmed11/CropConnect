// backend/utils/calculations.js

/**
 * Calculate surplus or deficit balance, status, and severity.
 *
 * STATUS thresholds:
 *   surplus   → production > consumption by more than 5%
 *   balanced  → within ±5% of consumption
 *   deficit   → production < consumption by more than 5%
 *
 * SEVERITY thresholds (FAO food security standards):
 *   mild      →  5%–20% below consumption  (manageable)
 *   moderate  → 20%–40% below consumption  (needs redistribution)
 *   critical  →    >40% below consumption  (urgent intervention)
 */
export const calculateSurplusDeficit = (production, consumption) => {
  if (consumption === 0) {
    return {
      production,
      consumption: 0,
      balance: production,
      status: production > 0 ? "surplus" : "balanced",
      surplusDeficitPercentage: 0,
      selfSufficiencyRatio: 0,
      severity: "none",
      requiresIntervention: false,
    };
  }

  const balance    = production - consumption;
  const percentage = parseFloat(((balance / consumption) * 100).toFixed(2));
  const selfSufficiency = parseFloat(((production / consumption) * 100).toFixed(2));

  let status = "balanced";
  if (percentage > 5)  status = "surplus";
  else if (percentage < -5) status = "deficit";

  let severity = "none";
  if (status === "deficit") {
    const absPct = Math.abs(percentage);
    if (absPct > 40)      severity = "critical";
    else if (absPct > 20) severity = "moderate";
    else                  severity = "mild";
  }

  return {
    production,
    consumption,
    balance,
    status,
    surplusDeficitPercentage: percentage,
    selfSufficiencyRatio:     selfSufficiency,
    severity,
    requiresIntervention: severity === "critical" || severity === "moderate",
  };
};

/**
 * Calculate consumption estimate.
 * @param {Number} population          - Population count
 * @param {Number} perCapitaConsumption - Per capita consumption in kg/person/year
 * @returns {Number} Total consumption in tonnes
 */
export const calculateConsumption = (population, perCapitaConsumption) => {
  return (population * perCapitaConsumption) / 1000;
};

/**
 * Calculate year-over-year growth rate.
 */
export const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
};

/**
 * Calculate yield from production and area.
 */
export const calculateYield = (production, area) => {
  if (!area || area === 0) return 0;
  return parseFloat((production / area).toFixed(3));
};

/**
 * Haversine distance between two [lat, lng] coordinate pairs.
 * @returns {Number} Distance in km
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return null;
  const toRad = val => (val * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/**
 * Generate actionable recommendations based on deficit severity.
 */
export const generateRecommendations = (severity, region, crop) => {
  const recommendations = [];
  if (severity === "critical") {
    recommendations.push(`Immediate intervention required in ${region} for ${crop}`);
    recommendations.push(`Activate emergency food distribution from nearest surplus district`);
    recommendations.push(`Coordinate with provincial food authority`);
    recommendations.push(`Consider strategic reserve release`);
  } else if (severity === "moderate") {
    recommendations.push(`Increase ${crop} cultivation in ${region} next season`);
    recommendations.push(`Arrange inter-district supply from nearby surplus areas`);
    recommendations.push(`Review storage infrastructure capacity`);
  } else if (severity === "mild") {
    recommendations.push(`Monitor ${crop} production trends in ${region}`);
    recommendations.push(`Optimise local supply chain efficiency`);
  }
  return recommendations;
};

export default {
  calculateSurplusDeficit,
  calculateConsumption,
  calculateGrowthRate,
  calculateYield,
  generateRecommendations,
  calculateDistance,
};
