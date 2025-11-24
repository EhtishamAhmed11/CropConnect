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
};
