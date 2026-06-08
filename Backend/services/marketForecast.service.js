import MarketPrice from "../models/marketPrice.model.js";
import MarketForecast from "../models/marketForecast.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";
import Weather from "../models/weather.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import { MSP_PRICES } from "./marketScraper.service.js";

// ─── Seasonal Factor Tables ───────────────────────────────────────────────────

const SEASONAL_FACTORS = {
    Wheat: {
        //        Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
        factors: [1.06, 1.07, 1.05, 0.95, 0.93, 0.94, 0.97, 1.00, 1.02, 1.05, 1.07, 1.08],
        labels: {
            low: "Harvest season — supply glut keeps prices low",
            high: "Pre-harvest lean season — supply tightening",
            mid: "Mid-season — prices near average",
        },
    },
    Rice: {
        factors: [1.05, 1.06, 1.07, 1.08, 1.07, 1.05, 1.03, 1.01, 0.97, 0.94, 0.93, 0.97],
        labels: {
            low: "Rice harvest season — fresh supply lowering prices",
            high: "Off-season — old stocks running low",
            mid: "Mid-cycle — prices near seasonal average",
        },
    },
    Cotton: {
        factors: [1.04, 1.05, 1.06, 1.07, 1.07, 1.06, 1.03, 1.00, 0.95, 0.94, 0.95, 0.99],
        labels: {
            low: "Cotton ginning season — fresh arrivals depressing prices",
            high: "Off-season — mill demand outpacing old stocks",
            mid: "Transition period — prices near average",
        },
    },
};

// ─── Weather Factor ───────────────────────────────────────────────────────────

async function getWeatherFactor(districtId, cropName) {
    try {
        const weather = await Weather.findOne({ district: districtId })
            .sort({ date: -1 })
            .select("temperature humidity rainfall");

        if (!weather) return { multiplier: 1.0, label: "No weather data available", impact: "neutral" };

        const temp = weather.temperature?.max || weather.temperature?.avg || 0;
        const rainfall = weather.rainfall || 0;
        const humidity = weather.humidity || 0;

        if (rainfall > 80) return { multiplier: 1.12, label: `Flood risk (${rainfall}mm rain) — potential crop damage`, impact: "positive" };

        const heatThresholds = { Wheat: 32, Rice: 38, Cotton: 40 };
        const heatLimit = heatThresholds[cropName] || 35;

        if (temp > heatLimit + 3) return { multiplier: 1.10, label: `Severe heat stress (${temp}°C) — yield risk`, impact: "positive" };
        if (temp > heatLimit) return { multiplier: 1.05, label: `Moderate heat stress (${temp}°C)`, impact: "positive" };

        if (cropName === "Rice" && humidity > 85)
            return { multiplier: 1.06, label: `High humidity (${humidity}%) — disease risk for rice`, impact: "positive" };

        return { multiplier: 1.0, label: "Normal weather conditions", impact: "neutral" };
    } catch {
        return { multiplier: 1.0, label: "Weather check unavailable", impact: "neutral" };
    }
}

// ─── Supply Factor ────────────────────────────────────────────────────────────

async function getSupplyFactor(districtId, cropId) {
    try {
        const currentYear = new Date().getFullYear();
        const yearStr = `${currentYear - 1}-${String(currentYear).slice(-2)}`;

        const record = await SurplusDeficit.findOne({
            district: districtId,
            cropType: cropId,
            year: { $in: [yearStr, String(currentYear)] },
        }).sort({ year: -1 });

        if (!record) return { multiplier: 1.0, label: "No supply data available", impact: "neutral" };

        const { status, severity } = record;

        if (status === "deficit") {
            if (severity === "critical") return { multiplier: 1.10, label: "Critical supply deficit in region", impact: "positive" };
            if (severity === "high") return { multiplier: 1.06, label: "High supply deficit in region", impact: "positive" };
            return { multiplier: 1.03, label: "Moderate supply deficit in region", impact: "positive" };
        }
        if (status === "surplus") return { multiplier: 0.96, label: "Regional surplus — supply exceeding demand", impact: "negative" };

        return { multiplier: 1.0, label: "Balanced supply and demand", impact: "neutral" };
    } catch {
        return { multiplier: 1.0, label: "Supply check unavailable", impact: "neutral" };
    }
}

// ─── Moving Average ───────────────────────────────────────────────────────────

/**
 * Returns 7-day moving average, or falls back to 14-day.
 * If still no data → returns null (caller will use MSP instead).
 */
async function getMovingAverage(cropId, districtId) {
    for (const days of [7, 14]) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const prices = await MarketPrice.find({
            cropType: cropId,
            district: districtId,
            date: { $gte: since },
        }).select("price");

        if (prices.length >= 2) {
            const avg = prices.reduce((s, p) => s + p.price, 0) / prices.length;
            return { price: Math.round(avg), source: `${days}-day average` };
        }
    }
    return null; // no history at all
}

// ─── MSP Fallback Base Price ──────────────────────────────────────────────────

/**
 * FIX for "205 skipped": when a district has no price history yet,
 * use the government Minimum Support Price as the base instead of skipping.
 * The seasonal/weather/supply factors still apply on top of it,
 * so the forecast is still meaningful — just anchored to MSP rather
 * than a scraped average.
 */
function getMspBasePrice(cropName) {
    const price = MSP_PRICES[cropName];
    if (!price) return null;
    return { price, source: "MSP_baseline" };
}

// ─── Forecast Builder ─────────────────────────────────────────────────────────

async function buildForecastForCrop(crop, district) {
    // Try moving average first, fall back to MSP — never skip
    const baseResult = (await getMovingAverage(crop._id, district._id)) || getMspBasePrice(crop.name);
    if (!baseResult) return null;

    const { price: basePrice, source: baseSource } = baseResult;
    const month = new Date().getMonth(); // 0-indexed

    // ── Seasonal ──
    const seasonalTable = SEASONAL_FACTORS[crop.name];
    let seasonalMultiplier = 1.0;
    let seasonalLabel = "Seasonal data unavailable";
    let seasonalImpact = "neutral";

    if (seasonalTable) {
        seasonalMultiplier = seasonalTable.factors[month];
        const { labels } = seasonalTable;
        if (seasonalMultiplier < 0.97) { seasonalLabel = labels.low; seasonalImpact = "negative"; }
        else if (seasonalMultiplier > 1.03) { seasonalLabel = labels.high; seasonalImpact = "positive"; }
        else { seasonalLabel = labels.mid; seasonalImpact = "neutral"; }
    }

    // ── Weather ──
    const weatherFactor = await getWeatherFactor(district._id, crop.name);

    // ── Supply ──
    const supplyFactor = await getSupplyFactor(district._id, crop._id);

    // ── Combined multiplier ──
    const combined = seasonalMultiplier * weatherFactor.multiplier * supplyFactor.multiplier;

    // ── Forecast prices (three windows) ──
    const day10Price = Math.round(basePrice * combined);
    const day20Price = Math.round(basePrice * combined * (1 + (combined - 1) * 0.3));
    const day30Price = Math.round(basePrice * combined * (1 + (combined - 1) * 0.6));

    const band = (price, pct) => ({
        price,
        confidenceLow: Math.round(price * (1 - pct)),
        confidenceHigh: Math.round(price * (1 + pct)),
    });

    // ── Trend ──
    const changePct = ((day30Price - basePrice) / basePrice) * 100;
    const trend = changePct > 2 ? "rising" : changePct < -2 ? "falling" : "stable";

    // ── Plain-English summary ──
    const direction = trend === "rising" ? "rise" : trend === "falling" ? "fall" : "remain stable";
    const pctAbs = Math.abs(changePct).toFixed(1);
    const drivers = [
        seasonalLabel,
        weatherFactor.impact !== "neutral" ? weatherFactor.label : null,
        supplyFactor.impact !== "neutral" ? supplyFactor.label : null,
    ].filter(Boolean).join("; ").toLowerCase();

    const summary =
        `${crop.name} prices expected to ${direction} by ~${pctAbs}% over 30 days` +
        (baseSource === "MSP_baseline" ? " (based on government support price)" : "") +
        `. Key drivers: ${drivers}.`;

    return {
        cropType: crop._id,
        district: district._id,
        basePrice,
        forecast: {
            day10: band(day10Price, 0.06),
            day20: band(day20Price, 0.09),
            day30: band(day30Price, 0.12),
        },
        factors: {
            seasonal: { label: seasonalLabel, multiplier: seasonalMultiplier, impact: seasonalImpact },
            weather: weatherFactor,
            supply: supplyFactor,
        },
        trend,
        summary,
        generatedAt: new Date(),
    };
}

// ─── Exported: Run All Forecasts ──────────────────────────────────────────────

export async function runMarketForecasts() {
    console.log("[MarketForecast] Starting forecast generation...");

    const crops = await CropType.find({ name: { $in: ["Wheat", "Rice", "Cotton"] } });
    const districts = await District.find({}).select("_id name");

    let generated = 0;
    let skipped = 0;

    for (const crop of crops) {
        for (const district of districts) {
            try {
                const data = await buildForecastForCrop(crop, district);
                if (!data) { skipped++; continue; }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                await MarketForecast.findOneAndUpdate(
                    { cropType: crop._id, district: district._id, generatedAt: { $gte: today } },
                    data,
                    { upsert: true, new: true }
                );

                generated++;
            } catch (err) {
                console.warn(`[MarketForecast] Failed ${crop.name}/${district.name}: ${err.message}`);
                skipped++;
            }
        }
    }

    console.log(`[MarketForecast] Done. Generated: ${generated}, Skipped: ${skipped}`);
    return { generated, skipped };
}

// ─── Exported: Query Helpers ──────────────────────────────────────────────────

export async function getForecastForCropDistrict(cropId, districtId) {
    return MarketForecast.findOne({ cropType: cropId, district: districtId })
        .sort({ generatedAt: -1 })
        .populate("cropType", "name")
        .populate("district", "name");
}

export async function getAllForecastsForDistrict(districtId) {
    return MarketForecast.find({ district: districtId })
        .sort({ generatedAt: -1 })
        .populate("cropType", "name")
        .populate("district", "name");
}