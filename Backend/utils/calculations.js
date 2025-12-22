/**
 * Calculate surplus or deficit
 * @param {Number} production - Total production in tonnes
 * @param {Number} consumption - Total consumption in tonnes
 * @returns {Object} Calculation results
 */
export const calculateSurplusDeficit = (production, consumption) => {
  const balance = production - consumption;
  const percentage =
    consumption > 0 ? ((balance / consumption) * 100).toFixed(2) : 0;
  const selfSufficiency =
    consumption > 0 ? ((production / consumption) * 100).toFixed(2) : 0;

  let status = "balanced";
  if (balance > consumption * 0.05) status = "surplus";
  else if (balance < -consumption * 0.05) status = "deficit";

  let severity = "none";
  if (status === "deficit") {
    const deficitPercent = Math.abs(parseFloat(percentage));
    if (deficitPercent > 30) severity = "critical";
    else if (deficitPercent > 15) severity = "moderate";
    else severity = "mild";
  }

  const requiresIntervention =
    severity === "critical" || severity === "moderate";

  return {
    production,
    consumption,
    balance,
    status,
    surplusDeficitPercentage: parseFloat(percentage),
    selfSufficiencyRatio: parseFloat(selfSufficiency),
    severity,
    requiresIntervention,
  };
};

/**
 * Calculate consumption estimate
 * @param {Number} population - Population count
 * @param {Number} perCapitaConsumption - Per capita consumption in kg
 * @returns {Number} Total consumption in tonnes
 */
export const calculateConsumption = (population, perCapitaConsumption) => {
  // Convert kg to tonnes (divide by 1000)
  return (population * perCapitaConsumption) / 1000;
};

/**
 * Calculate year-over-year growth rate
 * @param {Number} currentValue - Current year value
 * @param {Number} previousValue - Previous year value
 * @returns {Number} Growth rate percentage
 */
export const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return (((currentValue - previousValue) / previousValue) * 100).toFixed(2);
};

/**
 * Calculate yield from production and area
 * @param {Number} production - Production in tonnes
 * @param {Number} area - Area in hectares
 * @returns {Number} Yield in tonnes per hectare
 */
const calculateYield = (production, area) => {
  if (!area || area === 0) return 0;
  return (production / area).toFixed(3);
};

/**
 * Generate recommendations based on deficit severity
 * @param {String} severity - Severity level
 * @param {String} region - Region name
 * @param {String} crop - Crop name
 * @returns {Array} Array of recommendation strings
 */
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [lat, lng]
 * @param {Array} coord2 - [lat, lng]
 * @returns {Number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) return null;

  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371; // Radius of Earth in km

  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const generateRecommendations = (severity, region, crop) => {
  const recommendations = [];

  if (severity === "critical") {
    recommendations.push(
      `Immediate intervention required in ${region} for ${crop}`
    );
    recommendations.push(`Establish emergency food distribution centers`);
    recommendations.push(`Coordinate with NGOs for relief operations`);
    recommendations.push(`Consider imports to meet demand`);
  } else if (severity === "moderate") {
    recommendations.push(
      `Increase ${crop} cultivation in ${region} next season`
    );
    recommendations.push(`Improve storage and distribution infrastructure`);
    recommendations.push(`Provide subsidies or incentives to farmers`);
  } else if (severity === "mild") {
    recommendations.push(`Monitor ${crop} production trends in ${region}`);
    recommendations.push(`Optimize supply chain efficiency`);
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
