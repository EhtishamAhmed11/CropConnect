/**
 * Report Insights Generator
 * Generates actionable decision-support insights from production, surplus/deficit,
 * weather, and market price data.
 */

// ── Production Analysis Insights ─────────────────────────────────────────────
export function generateProductionInsights(data, { weatherData = [], marketData = [], historicalData = [] } = {}) {
  if (!data || data.length === 0) return { insights: [], chartData: {} };

  const insights = [];

  // 1. Aggregate production by province
  const provinceMap = {};
  data.forEach((item) => {
    const pName = item.province?.name || "Unknown";
    if (!provinceMap[pName]) provinceMap[pName] = { production: 0, area: 0, count: 0 };
    provinceMap[pName].production += item.production?.value || 0;
    provinceMap[pName].area += item.areaCultivated?.value || 0;
    provinceMap[pName].count += 1;
  });

  const provinces = Object.entries(provinceMap)
    .map(([name, stats]) => ({
      name,
      production: stats.production,
      area: stats.area,
      yield: stats.area > 0 ? stats.production / stats.area : 0,
      count: stats.count,
    }))
    .sort((a, b) => b.production - a.production);

  // Top producer insight
  if (provinces.length > 0) {
    const top = provinces[0];
    const totalProd = provinces.reduce((s, p) => s + p.production, 0);
    const pct = totalProd > 0 ? ((top.production / totalProd) * 100).toFixed(1) : 0;
    insights.push({
      type: "highlight",
      icon: "🏆",
      title: "Top Producing Region",
      text: `${top.name} leads with ${top.production.toLocaleString()} tonnes (${pct}% of total output). Focus storage and transport infrastructure investments here to reduce post-harvest losses.`,
    });
  }

  // Bottom performer insight
  if (provinces.length > 1) {
    const bottom = provinces[provinces.length - 1];
    insights.push({
      type: "warning",
      icon: "⚠️",
      title: "Lowest Output Region",
      text: `${bottom.name} produced only ${bottom.production.toLocaleString()} tonnes across ${bottom.count} districts. Consider targeted interventions: subsidized seeds, irrigation support, or soil improvement programs.`,
    });
  }

  // 2. Aggregate by crop
  const cropMap = {};
  data.forEach((item) => {
    const cName = item.cropType?.name || item.cropName || "Unknown";
    if (!cropMap[cName]) cropMap[cName] = { production: 0, area: 0 };
    cropMap[cName].production += item.production?.value || 0;
    cropMap[cName].area += item.areaCultivated?.value || 0;
  });

  const crops = Object.entries(cropMap)
    .map(([name, stats]) => ({
      name,
      production: stats.production,
      area: stats.area,
      yield: stats.area > 0 ? +(stats.production / stats.area).toFixed(2) : 0,
    }))
    .sort((a, b) => b.production - a.production);

  // Yield efficiency insight
  const bestYield = [...crops].sort((a, b) => b.yield - a.yield)[0];
  const worstYield = [...crops].sort((a, b) => a.yield - b.yield)[0];
  if (bestYield && worstYield && crops.length > 1) {
    insights.push({
      type: "info",
      icon: "📊",
      title: "Yield Efficiency Gap",
      text: `${bestYield.name} has the highest yield at ${bestYield.yield} t/ha, while ${worstYield.name} is at ${worstYield.yield} t/ha. Research into ${worstYield.name} farming practices could close this gap significantly.`,
    });
  }

  // 3. Concentration risk
  const totalProd = provinces.reduce((s, p) => s + p.production, 0);
  const topTwo = provinces.slice(0, 2).reduce((s, p) => s + p.production, 0);
  if (totalProd > 0 && (topTwo / totalProd) > 0.7) {
    insights.push({
      type: "warning",
      icon: "🔴",
      title: "High Concentration Risk",
      text: `Top 2 regions account for ${((topTwo / totalProd) * 100).toFixed(0)}% of total production. Any natural disaster in these regions could severely impact national food supply. Diversifying production is strongly recommended.`,
    });
  }

  // ── 4. Weather-Correlated Insights ──
  if (weatherData.length > 0) {
    // Aggregate weather by district for cross-referencing
    const weatherByDistrict = {};
    weatherData.forEach((w) => {
      const dId = w.district?._id?.toString() || w.district?.toString();
      if (dId) weatherByDistrict[dId] = w;
    });

    // Find districts with extreme weather
    const highRainfallDistricts = weatherData.filter(w => w.rainfall > 50);
    const lowRainfallDistricts = weatherData.filter(w => w.rainfall < 5 && w.condition !== "Clear");
    const highTempDistricts = weatherData.filter(w => w.temperature > 42);

    if (highRainfallDistricts.length > 0) {
      const names = highRainfallDistricts.slice(0, 3).map(w => w.district?.name || "Unknown").join(", ");
      insights.push({
        type: "warning",
        icon: "🌧️",
        title: "Flood/Heavy Rain Risk",
        text: `${highRainfallDistricts.length} district(s) currently experiencing heavy rainfall (>50mm): ${names}. Crops in these areas may face waterlogging or damage. Consider activating drainage systems and preparing post-flood crop recovery plans.`,
      });
    }

    if (highTempDistricts.length > 0) {
      const names = highTempDistricts.slice(0, 3).map(w => w.district?.name || "Unknown").join(", ");
      insights.push({
        type: "danger",
        icon: "🌡️",
        title: "Extreme Heat Alert",
        text: `${highTempDistricts.length} district(s) experiencing extreme heat (>42°C): ${names}. Wheat and other temperature-sensitive crops may suffer significant yield reduction. Recommend immediate irrigation scheduling.`,
      });
    }

    // Average weather stats for chart
    const avgTemp = weatherData.length > 0 ? (weatherData.reduce((s, w) => s + w.temperature, 0) / weatherData.length).toFixed(1) : null;
    const avgRainfall = weatherData.length > 0 ? (weatherData.reduce((s, w) => s + (w.rainfall || 0), 0) / weatherData.length).toFixed(1) : null;
    const avgHumidity = weatherData.length > 0 ? (weatherData.reduce((s, w) => s + w.humidity, 0) / weatherData.length).toFixed(0) : null;

    if (avgTemp) {
      insights.push({
        type: "info",
        icon: "🌤️",
        title: "Current Weather Overview",
        text: `Average temperature: ${avgTemp}°C, Average rainfall: ${avgRainfall}mm, Average humidity: ${avgHumidity}%. These conditions ${parseFloat(avgTemp) > 35 ? "may stress crops — consider irrigation support" : "are generally favorable for current growing season"}.`,
      });
    }
  }

  // ── 5. Market Price Insights ──
  if (marketData.length > 0) {
    const cropPrices = {};
    marketData.forEach((m) => {
      const cName = m.cropType?.name || "Unknown";
      if (!cropPrices[cName]) cropPrices[cName] = { prices: [], districts: new Set() };
      cropPrices[cName].prices.push(m.price);
      cropPrices[cName].districts.add(m.district?.name || "?");
    });

    const priceStats = Object.entries(cropPrices).map(([name, data]) => ({
      name,
      avg: +(data.prices.reduce((s, p) => s + p, 0) / data.prices.length).toFixed(0),
      min: Math.min(...data.prices),
      max: Math.max(...data.prices),
      spread: Math.max(...data.prices) - Math.min(...data.prices),
      count: data.districts.size,
    }));

    // High price volatility
    const highVolatility = priceStats.filter(p => p.spread > p.avg * 0.5);
    if (highVolatility.length > 0) {
      const names = highVolatility.map(p => `${p.name} (spread: PKR ${p.spread.toLocaleString()})`).join(", ");
      insights.push({
        type: "warning",
        icon: "💹",
        title: "Price Volatility Alert",
        text: `High price variation detected: ${names}. This suggests supply chain inefficiencies or regional hoarding. Recommend market monitoring and price stabilization interventions.`,
      });
    }

    // Price vs production mismatch
    const mismatch = priceStats.find(p => {
      const crop = crops.find(c => c.name.toLowerCase() === p.name.toLowerCase());
      return crop && crop.production > totalProd * 0.3 && p.avg > priceStats.reduce((s, pp) => s + pp.avg, 0) / priceStats.length;
    });
    if (mismatch) {
      insights.push({
        type: "warning",
        icon: "📦",
        title: "Supply-Price Mismatch",
        text: `${mismatch.name} has high production but above-average prices (PKR ${mismatch.avg}/unit). This may indicate supply chain bottlenecks, storage issues, or export-driven price inflation. Investigate distribution channels.`,
      });
    }
  }

  // 6. Decision recommendations
  insights.push({
    type: "action",
    icon: "💡",
    title: "Key Recommendations",
    text: `1) Prioritize cold-chain and logistics in ${provinces[0]?.name || "top"} region. 2) Expand cultivated area in underperforming regions. 3) Invest in high-yield seed varieties for low-performing crops.`,
  });

  // ── Chart data for frontend ──
  const chartData = {
    productionByProvince: provinces.map((p) => ({
      name: p.name,
      production: Math.round(p.production),
      area: Math.round(p.area),
    })),
    productionByCrop: crops.map((c) => ({
      name: c.name,
      production: Math.round(c.production),
      yield: c.yield,
    })),
    yieldComparison: crops.map((c) => ({
      name: c.name,
      yield: c.yield,
    })),
  };

  // Historical trend data
  if (historicalData.length > 0) {
    const yearlyAgg = {};
    historicalData.forEach((item) => {
      const yr = item.year;
      if (!yearlyAgg[yr]) yearlyAgg[yr] = { production: 0, area: 0, count: 0 };
      yearlyAgg[yr].production += item.production?.value || 0;
      yearlyAgg[yr].area += item.areaCultivated?.value || 0;
      yearlyAgg[yr].count += 1;
    });
    chartData.historicalTrends = Object.entries(yearlyAgg)
      .map(([year, stats]) => ({
        year,
        production: Math.round(stats.production),
        area: Math.round(stats.area),
        yield: stats.area > 0 ? +(stats.production / stats.area).toFixed(2) : 0,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Trend insight
    if (chartData.historicalTrends.length >= 2) {
      const first = chartData.historicalTrends[0];
      const last = chartData.historicalTrends[chartData.historicalTrends.length - 1];
      const change = last.production - first.production;
      const pctChange = first.production > 0 ? ((change / first.production) * 100).toFixed(1) : 0;
      insights.push({
        type: change >= 0 ? "highlight" : "danger",
        icon: change >= 0 ? "📈" : "📉",
        title: `${Math.abs(pctChange)}% Production ${change >= 0 ? "Growth" : "Decline"} Over ${chartData.historicalTrends.length} Years`,
        text: `Production moved from ${first.production.toLocaleString()} tonnes (${first.year}) to ${last.production.toLocaleString()} tonnes (${last.year}). ${change >= 0 ? "Sustained growth indicates effective agricultural policies." : "Declining output requires urgent intervention."}`,
      });
    }
  }

  // Weather chart data
  if (weatherData.length > 0) {
    chartData.weatherOverview = weatherData.slice(0, 15).map(w => ({
      name: w.district?.name || "?",
      temperature: w.temperature,
      rainfall: w.rainfall || 0,
      humidity: w.humidity,
    }));
  }

  // Market price chart data
  if (marketData.length > 0) {
    const cropPriceAgg = {};
    marketData.forEach((m) => {
      const cName = m.cropType?.name || "Unknown";
      if (!cropPriceAgg[cName]) cropPriceAgg[cName] = { total: 0, count: 0 };
      cropPriceAgg[cName].total += m.price;
      cropPriceAgg[cName].count += 1;
    });
    chartData.marketPrices = Object.entries(cropPriceAgg)
      .map(([name, agg]) => ({
        name,
        avgPrice: Math.round(agg.total / agg.count),
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }

  return { insights, chartData };
}

// ── Surplus/Deficit Insights ─────────────────────────────────────────────────
export function generateSurplusDeficitInsights(data, { weatherData = [], marketData = [], historicalData = [] } = {}) {
  if (!data || data.length === 0) return { insights: [], chartData: {} };

  const insights = [];

  const surplusItems = data.filter((d) => d.status === "surplus");
  const deficitItems = data.filter((d) => d.status === "deficit");
  const criticalItems = data.filter((d) => d.severity === "critical");

  // 1. Overall balance
  const totalSurplus = surplusItems.reduce((s, d) => s + (d.balance || 0), 0);
  const totalDeficit = deficitItems.reduce((s, d) => s + Math.abs(d.balance || 0), 0);
  const netBalance = totalSurplus - totalDeficit;

  insights.push({
    type: netBalance >= 0 ? "highlight" : "warning",
    icon: netBalance >= 0 ? "✅" : "🚨",
    title: "National Food Balance",
    text: netBalance >= 0
      ? `The country has a net surplus of ${netBalance.toLocaleString()} tonnes. There is enough aggregate production to meet demand, but regional distribution remains critical.`
      : `The country faces a net deficit of ${Math.abs(netBalance).toLocaleString()} tonnes. Immediate action is required: increase imports, activate strategic reserves, or fast-track redistribution from surplus zones.`,
  });

  // 2. Critical deficit alert
  if (criticalItems.length > 0) {
    const critNames = criticalItems
      .slice(0, 5)
      .map((d) => `${d.district?.name || "Unknown"} (${d.cropType?.name || "?"})`)
      .join(", ");
    insights.push({
      type: "danger",
      icon: "🔴",
      title: `${criticalItems.length} Critical Deficit Zone${criticalItems.length > 1 ? "s" : ""}`,
      text: `These regions face severe food shortage: ${critNames}. Prioritize emergency food aid and logistic support immediately.`,
    });
  }

  // 3. Redistribution suggestions
  if (surplusItems.length > 0 && deficitItems.length > 0) {
    const topSurplus = [...surplusItems].sort((a, b) => b.balance - a.balance).slice(0, 3);
    const topDeficit = [...deficitItems].sort((a, b) => a.balance - b.balance).slice(0, 3);

    const pairs = topDeficit.map((def, i) => {
      const src = topSurplus[i % topSurplus.length];
      return `Ship from ${src.district?.name || src.province?.name || "Surplus Zone"} → ${def.district?.name || def.province?.name || "Deficit Zone"} (need: ${Math.abs(def.balance).toLocaleString()} t)`;
    });

    insights.push({
      type: "action",
      icon: "🚛",
      title: "Redistribution Routes",
      text: pairs.join(". ") + ".",
    });
  }

  // 4. Self-sufficiency
  const selfSufficientCount = data.filter((d) => (d.selfSufficiencyRatio || 0) >= 100).length;
  const pct = data.length > 0 ? ((selfSufficientCount / data.length) * 100).toFixed(0) : 0;
  insights.push({
    type: "info",
    icon: "📈",
    title: "Self-Sufficiency Rate",
    text: `${selfSufficientCount} of ${data.length} regions (${pct}%) are self-sufficient. Aim to raise this above 80% through yield improvement and demand management programs.`,
  });

  // ── 5. Weather-Correlated Insights ──
  if (weatherData.length > 0) {
    const deficitDistricts = new Set(deficitItems.map(d => d.district?._id?.toString()));
    const affectedWeather = weatherData.filter(w => {
      const dId = w.district?._id?.toString() || w.district?.toString();
      return deficitDistricts.has(dId);
    });

    const rainyDeficits = affectedWeather.filter(w => w.rainfall > 30);
    const hotDeficits = affectedWeather.filter(w => w.temperature > 40);

    if (rainyDeficits.length > 0) {
      insights.push({
        type: "warning",
        icon: "🌧️",
        title: "Weather Impact on Deficit Zones",
        text: `${rainyDeficits.length} deficit region(s) are experiencing heavy rainfall, which may worsen transport logistics and crop storage. Factor weather delays into redistribution planning.`,
      });
    }
    if (hotDeficits.length > 0) {
      insights.push({
        type: "danger",
        icon: "🌡️",
        title: "Heat Stress in Deficit Areas",
        text: `${hotDeficits.length} deficit region(s) have temperatures above 40°C. Perishable food aid may require cold-chain logistics. Prioritize heat-resistant crop varieties for next season.`,
      });
    }
  }

  // ── 6. Market Price Insights ──
  if (marketData.length > 0) {
    const deficitCrops = [...new Set(deficitItems.map(d => d.cropType?.name?.toLowerCase()))];
    const relevantPrices = marketData.filter(m => deficitCrops.includes(m.cropType?.name?.toLowerCase()));

    if (relevantPrices.length > 0) {
      const avgPrice = +(relevantPrices.reduce((s, p) => s + p.price, 0) / relevantPrices.length).toFixed(0);
      insights.push({
        type: "info",
        icon: "💰",
        title: "Market Prices for Deficit Crops",
        text: `Average market price for crops in deficit: PKR ${avgPrice.toLocaleString()}/unit across ${relevantPrices.length} records. Monitor prices in deficit regions to detect hoarding or speculative pricing.`,
      });
    }
  }

  // 5. Province-level aggregation for charts
  const provinceAgg = {};
  data.forEach((d) => {
    const pName = d.province?.name || "Unknown";
    if (!provinceAgg[pName]) provinceAgg[pName] = { surplus: 0, deficit: 0, count: 0 };
    if (d.status === "surplus") provinceAgg[pName].surplus += d.balance || 0;
    else if (d.status === "deficit") provinceAgg[pName].deficit += Math.abs(d.balance || 0);
    provinceAgg[pName].count += 1;
  });

  const chartData = {
    statusBreakdown: [
      { name: "Surplus", value: surplusItems.length, color: "#10b981" },
      { name: "Deficit", value: deficitItems.length, color: "#ef4444" },
      { name: "Balanced", value: data.length - surplusItems.length - deficitItems.length, color: "#6b7280" },
    ],
    balanceByProvince: Object.entries(provinceAgg)
      .map(([name, agg]) => ({
        name,
        surplus: Math.round(agg.surplus),
        deficit: Math.round(agg.deficit),
      }))
      .sort((a, b) => (b.surplus - b.deficit) - (a.surplus - a.deficit)),
    severityBreakdown: [
      { name: "Critical", value: criticalItems.length, color: "#dc2626" },
      { name: "Moderate", value: data.filter((d) => d.severity === "moderate").length, color: "#f97316" },
      { name: "Mild", value: data.filter((d) => d.severity === "mild").length, color: "#eab308" },
      { name: "None", value: data.filter((d) => d.severity === "none" || !d.severity).length, color: "#22c55e" },
    ],
    topDeficits: deficitItems
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 8)
      .map((d) => ({
        name: d.district?.name || d.province?.name || "Unknown",
        deficit: Math.abs(d.balance),
        crop: d.cropType?.name || "?",
      })),
  };

  // Historical trends for surplus deficit
  if (historicalData.length > 0) {
    const yearlyAgg = {};
    historicalData.forEach((item) => {
      const yr = item.year;
      if (!yearlyAgg[yr]) yearlyAgg[yr] = { surplus: 0, deficit: 0, count: 0 };
      if (item.status === "surplus") yearlyAgg[yr].surplus += item.balance || 0;
      else if (item.status === "deficit") yearlyAgg[yr].deficit += Math.abs(item.balance || 0);
      yearlyAgg[yr].count += 1;
    });
    chartData.historicalTrends = Object.entries(yearlyAgg)
      .map(([year, stats]) => ({
        year,
        surplus: Math.round(stats.surplus),
        deficit: Math.round(stats.deficit),
        netBalance: Math.round(stats.surplus - stats.deficit),
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }

  // Weather chart data for deficit regions
  if (weatherData.length > 0) {
    chartData.weatherOverview = weatherData.slice(0, 15).map(w => ({
      name: w.district?.name || "?",
      temperature: w.temperature,
      rainfall: w.rainfall || 0,
      humidity: w.humidity,
    }));
  }

  return { insights, chartData };
}
