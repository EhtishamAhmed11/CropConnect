/**
 * 04-surplusDeficit.seed.js  —  CropConnect
 * ============================================
 * Uses REAL MNFSR 2024-25 district production data.
 * Correct surplus/deficit calculation with proper:
 *   - Provincial aggregation (sum of districts, not re-randomised)
 *   - Cotton handled as industrial/export crop (not food consumption)
 *   - Correct severity thresholds (food security standards)
 *   - requiresIntervention flag properly set
 *
 * Run: node seeds/04-surplusDeficit.seed.js
 */

import mongoose from "mongoose";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import District from "../models/district.model.js";
import Province from "../models/province.model.js";
import CropType from "../models/cropType.model.js";
import ProductionData from "../models/productionData.model.js";

// ─── Real MNFSR 2024-25 district production data ─────────────────────────────
// Source: Ministry of National Food Security & Research
// Crops Area and Production District Wise 2024-25
// Units: area_ha = hectares, production_t = tonnes, yield_t_per_ha = tonnes/hectare

const REAL_DISTRICT_DATA = {
  "PB-BWN": { "WHEAT": { area_ha: 435000, production_t: 1557000, yield_t_per_ha: 3.5793 }, "RICE": { area_ha: 152970, production_t: 358030, yield_t_per_ha: 2.3405 }, "COTTON": { area_ha: 272750, production_t: 142174.4, yield_t_per_ha: 0.5213 } },
  "PB-RYK": { "WHEAT": { area_ha: 331000, production_t: 1211000, yield_t_per_ha: 3.6586 }, "RICE": { area_ha: 75680, production_t: 138790, yield_t_per_ha: 1.8339 }, "COTTON": { area_ha: 195050, production_t: 78116.7, yield_t_per_ha: 0.4005 } },
  "PB-BWP": { "WHEAT": { area_ha: 304000, production_t: 1101000, yield_t_per_ha: 3.6217 }, "RICE": { area_ha: 27910, production_t: 53210, yield_t_per_ha: 1.9065 }, "COTTON": { area_ha: 234310, production_t: 119593.3, yield_t_per_ha: 0.5104 } },
  "PB-JHG": { "WHEAT": { area_ha: 269000, production_t: 1015000, yield_t_per_ha: 3.7732 }, "RICE": { area_ha: 192230, production_t: 418090, yield_t_per_ha: 2.1749 }, "COTTON": { area_ha: 14570, production_t: 8154.9, yield_t_per_ha: 0.5597 } },
  "PB-FSD": { "WHEAT": { area_ha: 248000, production_t: 939000, yield_t_per_ha: 3.7863 }, "RICE": { area_ha: 44400, production_t: 308900, yield_t_per_ha: 6.9572 }, "COTTON": { area_ha: 11330, production_t: 7990, yield_t_per_ha: 0.7052 } },
  "PB-ATK": { "WHEAT": { area_ha: 181000, production_t: 262000, yield_t_per_ha: 1.4475 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "PB-RWP": { "WHEAT": { area_ha: 166000, production_t: 276000, yield_t_per_ha: 1.6627 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "PB-JHL": { "WHEAT": { area_ha: 84000, production_t: 174000, yield_t_per_ha: 2.0714 }, "RICE": { area_ha: 2430, production_t: 4030, yield_t_per_ha: 1.6584 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "PB-CKW": { "WHEAT": { area_ha: 103000, production_t: 168000, yield_t_per_ha: 1.6311 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "PB-SGD": { "WHEAT": { area_ha: 212000, production_t: 669000, yield_t_per_ha: 3.1557 }, "RICE": { area_ha: 61100, production_t: 113540, yield_t_per_ha: 1.8583 }, "COTTON": { area_ha: 3240, production_t: 1269.9, yield_t_per_ha: 0.3919 } },
  "PB-KHB": { "WHEAT": { area_ha: 110000, production_t: 249000, yield_t_per_ha: 2.2636 }, "RICE": { area_ha: 16990, production_t: 29760, yield_t_per_ha: 1.7516 }, "COTTON": { area_ha: 810, production_t: 421.6, yield_t_per_ha: 0.5205 } },
  "PB-MNW": { "WHEAT": { area_ha: 186000, production_t: 568000, yield_t_per_ha: 3.0538 }, "RICE": { area_ha: 3240, production_t: 6200, yield_t_per_ha: 1.9136 }, "COTTON": { area_ha: 41280, production_t: 21848.4, yield_t_per_ha: 0.5293 } },
  "PB-BHK": { "WHEAT": { area_ha: 177000, production_t: 512000, yield_t_per_ha: 2.8927 }, "RICE": { area_ha: 3650, production_t: 8700, yield_t_per_ha: 2.3836 }, "COTTON": { area_ha: 13350, production_t: 6592.6, yield_t_per_ha: 0.4938 } },
  "PB-TTS": { "WHEAT": { area_ha: 130000, production_t: 506000, yield_t_per_ha: 3.8923 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "ISL":    { "WHEAT": { area_ha: 19000, production_t: 32000, yield_t_per_ha: 1.6842 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "MUR":    { "WHEAT": { area_ha: 3000, production_t: 3000, yield_t_per_ha: 1.0 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "TAL":    { "WHEAT": { area_ha: 54000, production_t: 78000, yield_t_per_ha: 1.4444 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "BL-KZD": { "WHEAT": { area_ha: 58700, production_t: 151650, yield_t_per_ha: 2.5835 }, "RICE": { area_ha: 1000, production_t: 3060, yield_t_per_ha: 3.06 }, "COTTON": { area_ha: 23400, production_t: 10873.2, yield_t_per_ha: 0.4647 } },
  "AWA":    { "WHEAT": { area_ha: 21020, production_t: 52820, yield_t_per_ha: 2.5128 }, "RICE": { area_ha: 280, production_t: 650, yield_t_per_ha: 2.3214 }, "COTTON": { area_ha: 2950, production_t: 1414.4, yield_t_per_ha: 0.4795 } },
  "KHA":    { "WHEAT": { area_ha: 13320, production_t: 34850, yield_t_per_ha: 2.6164 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 18540, production_t: 7877.8, yield_t_per_ha: 0.4249 } },
  "WAS":    { "WHEAT": { area_ha: 10060, production_t: 20270, yield_t_per_ha: 2.0149 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 1200, production_t: 479.4, yield_t_per_ha: 0.3995 } },
  "LAS":    { "WHEAT": { area_ha: 25280, production_t: 67750, yield_t_per_ha: 2.68 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 52040, production_t: 25413.3, yield_t_per_ha: 0.4883 } },
  "TUR":    { "WHEAT": { area_ha: 3690, production_t: 10660, yield_t_per_ha: 2.8889 }, "RICE": { area_ha: 1130, production_t: 2610, yield_t_per_ha: 2.3097 }, "COTTON": { area_ha: 8060, production_t: 3437.4, yield_t_per_ha: 0.4265 } },
  "PAN":    { "WHEAT": { area_ha: 8800, production_t: 19300, yield_t_per_ha: 2.1932 }, "RICE": { area_ha: 20, production_t: 60, yield_t_per_ha: 3.0 }, "COTTON": { area_ha: 1390, production_t: 589.9, yield_t_per_ha: 0.4244 } },
  "GWA":    { "WHEAT": { area_ha: 360, production_t: 820, yield_t_per_ha: 2.2778 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 120, production_t: 49.3, yield_t_per_ha: 0.4108 } },
  "BOL":    { "RICE": { area_ha: 1070, production_t: 910, yield_t_per_ha: 0.8505 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
  "MAS":    { "WHEAT": { area_ha: 2050, production_t: 3960, yield_t_per_ha: 1.9317 }, "RICE": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 }, "COTTON": { area_ha: 0, production_t: 0, yield_t_per_ha: 0 } },
};

// ─── Consumption rates ────────────────────────────────────────────────────────
// Source: Pakistan Economic Survey / FAO
// WHEAT and RICE: food consumption per person per year
// COTTON: NOT food — tracked as production output only (industrial/export crop)
//         We use national demand (textile industry) as the "consumption" benchmark.
//         National cotton demand ≈ 2.2M bales = ~950,000 tonnes lint equivalent.
//         District cotton "consumption" = district share of national demand
//         (proportional to district production share).
//         For simplicity we set a per-capita industrial demand proxy of 3 kg/person.

const CONSUMPTION_RATES_KG = {
    WHEAT:  124,  // kg/person/year — food consumption (Pakistan Economic Survey)
    RICE:    24,  // kg/person/year — food consumption
    COTTON:   3,  // kg/person/year — industrial/textile demand proxy
                  // (NOT eaten; represents Pakistan's domestic textile demand)
};

// ─── Surplus/deficit calculation ──────────────────────────────────────────────
/**
 * Calculates balance, status, and severity for one district+crop combination.
 *
 * STATUS thresholds (food security standard):
 *   surplus   → production > consumption by more than 5%
 *   balanced  → within ±5% of consumption
 *   deficit   → production < consumption by more than 5%
 *
 * SEVERITY thresholds (aligned with FAO food security indicators):
 *   mild      → 5%–20% below consumption  (manageable, local market can cover)
 *   moderate  → 20%–40% below consumption (needs redistribution)
 *   critical  → >40% below consumption    (requires urgent intervention)
 *
 * requiresIntervention = true for moderate and critical deficits only
 */
const calculateSurplusDeficit = (production, consumption) => {
    const balance = production - consumption;

    // Avoid division by zero for districts with zero population or zero consumption
    if (consumption === 0) {
        return {
            balance: 0,
            status: production > 0 ? "surplus" : "balanced",
            severity: "none",
            surplusDeficitPercentage: 0,
            selfSufficiencyRatio: 0,
            requiresIntervention: false,
        };
    }

    const percentage = (balance / consumption) * 100;          // +ve = surplus, -ve = deficit
    const selfSufficiencyRatio = production / consumption;     // 1.0 = exactly self-sufficient

    let status, severity;

    if (percentage > 5) {
        status = "surplus";
        severity = "none";
    } else if (percentage >= -5) {
        status = "balanced";
        severity = "none";
    } else {
        status = "deficit";
        const absPct = Math.abs(percentage);
        if (absPct > 40)      severity = "critical";
        else if (absPct > 20) severity = "moderate";
        else                  severity = "mild";
    }

    return {
        balance:                  Math.round(balance),
        status,
        severity,
        surplusDeficitPercentage: parseFloat(percentage.toFixed(2)),
        selfSufficiencyRatio:     parseFloat(selfSufficiencyRatio.toFixed(4)),
        requiresIntervention:     ["critical", "moderate"].includes(severity),
    };
};

// ─── Main seed function ───────────────────────────────────────────────────────

const seedSurplusDeficit = async () => {
    try {
        console.log("🌾 Seeding surplus/deficit from REAL MNFSR 2024-25 data...\n");

        // Clear old estimated/seeded data — keep any manually entered records
        await SurplusDeficit.deleteMany({ dataSource: { $in: ["Estimated", "MNFSR_Official", "seed"] } });
        await ProductionData.deleteMany({ dataSource: { $in: ["Estimated", "MNFSR_Official"] } });

        const districts  = await District.find({}).populate("province").lean();
        const provinces  = await Province.find({}).lean();
        const crops      = await CropType.find({}).lean();
        const cropMap    = Object.fromEntries(crops.map(c => [c.code, c]));

        const DATA_YEAR  = "2024-25";
        const CROP_CODES = ["WHEAT", "RICE", "COTTON"];

        // ── Step 1: District-level records ─────────────────────────────────────
        console.log("📍 Processing districts...");

        // We'll collect district production per province for aggregation in Step 2
        // Structure: provinceTotals[provinceCode][cropCode] = { production, consumption }
        const provinceTotals = {};

        let distInserted = 0;
        let distSkipped  = 0;

        for (const district of districts) {
            const mnfsrData    = REAL_DISTRICT_DATA[district.code];
            const provinceCode = district.provinceCode;

            // Ensure province bucket exists
            if (!provinceTotals[provinceCode]) {
                provinceTotals[provinceCode] = {};
                CROP_CODES.forEach(c => {
                    provinceTotals[provinceCode][c] = { production: 0, consumption: 0 };
                });
            }

            for (const cropCode of CROP_CODES) {
                const cropType = cropMap[cropCode];
                if (!cropType) continue;

                const population      = district.population || 0;
                const consumptionRate = CONSUMPTION_RATES_KG[cropCode];
                const consumption     = Math.round((population * consumptionRate) / 1000);

                // Get real production — skip district+crop if not in MNFSR data
                const cropData = mnfsrData?.[cropCode];
                if (!cropData || cropData.production_t === undefined) {
                    console.log(`   ⚠️  Skipping ${district.name} (${district.code}) - ${cropCode}: not in MNFSR data`);
                    distSkipped++;
                    // Still add consumption to province total so province isn't undercounted
                    provinceTotals[provinceCode][cropCode].consumption += consumption;
                    continue;
                }

                const production = cropData.production_t;

                // Upsert ProductionData record
                await ProductionData.findOneAndUpdate(
                    { year: DATA_YEAR, districtCode: district.code, cropCode },
                    {
                        year:     DATA_YEAR,
                        cropYear: {
                            startYear: parseInt(DATA_YEAR.split("-")[0]),
                            endYear:   2000 + parseInt(DATA_YEAR.split("-")[1]),
                        },
                        level:         "district",
                        district:      district._id,
                        districtCode:  district.code,
                        province:      district.province._id,
                        provinceCode,
                        cropType:      cropType._id,
                        cropCode,
                        cropName:      cropType.name,
                        areaCultivated: { value: cropData.area_ha,        unit: "hectares" },
                        production:     { value: production,               unit: "tonnes" },
                        yield:          { value: cropData.yield_t_per_ha,  unit: "tonnes_per_hectare" },
                        dataSource:    "MNFSR_Official",
                        reliability:   "high",
                        notes:         `MNFSR Crops Area and Production District Wise ${DATA_YEAR}`,
                    },
                    { upsert: true, new: true }
                );

                // Calculate surplus/deficit
                const calc = calculateSurplusDeficit(production, consumption);

                // Upsert SurplusDeficit record
                await SurplusDeficit.findOneAndUpdate(
                    { year: DATA_YEAR, districtCode: district.code, cropCode },
                    {
                        year:                    DATA_YEAR,
                        level:                   "district",
                        district:                district._id,
                        districtCode:            district.code,
                        province:                district.province._id,
                        provinceCode,
                        cropType:                cropType._id,
                        cropCode,
                        production,
                        consumption,
                        balance:                 calc.balance,
                        status:                  calc.status,
                        severity:                calc.severity,
                        surplusDeficitPercentage: calc.surplusDeficitPercentage,
                        selfSufficiencyRatio:    calc.selfSufficiencyRatio,
                        requiresIntervention:    calc.requiresIntervention,
                        dataSource:              "MNFSR_Official",
                        calculatedAt:            new Date(),
                    },
                    { upsert: true, new: true }
                );

                // Accumulate into province totals
                provinceTotals[provinceCode][cropCode].production  += production;
                provinceTotals[provinceCode][cropCode].consumption += consumption;

                distInserted++;
            }
        }

        console.log(`   ✅ Districts done: ${distInserted} records, ${distSkipped} skipped\n`);

        // ── Step 2: Provincial-level records (aggregated from districts) ────────
        // This is the KEY fix — province = SUM of its real districts, not re-randomised.
        console.log("🏛️  Processing provinces (aggregated from district totals)...");

        let provInserted = 0;

        for (const province of provinces) {
            const totals = provinceTotals[province.code];
            if (!totals) {
                console.log(`   ⚠️  No district data found for province ${province.code}`);
                continue;
            }

            for (const cropCode of CROP_CODES) {
                const cropType = cropMap[cropCode];
                if (!cropType) continue;

                const { production, consumption } = totals[cropCode];

                // Skip if both are zero (province genuinely doesn't grow this crop)
                if (production === 0 && consumption === 0) continue;

                const calc = calculateSurplusDeficit(production, consumption);

                await SurplusDeficit.findOneAndUpdate(
                    { year: DATA_YEAR, provinceCode: province.code, cropCode, level: "provincial" },
                    {
                        year:                    DATA_YEAR,
                        level:                   "provincial",
                        province:                province._id,
                        provinceCode:            province.code,
                        cropType:                cropType._id,
                        cropCode,
                        production,
                        consumption,
                        balance:                 calc.balance,
                        status:                  calc.status,
                        severity:                calc.severity,
                        surplusDeficitPercentage: calc.surplusDeficitPercentage,
                        selfSufficiencyRatio:    calc.selfSufficiencyRatio,
                        requiresIntervention:    calc.requiresIntervention,
                        dataSource:              "MNFSR_Official",
                        calculatedAt:            new Date(),
                    },
                    { upsert: true, new: true }
                );

                provInserted++;
            }
        }

        console.log(`   ✅ Provinces done: ${provInserted} records\n`);

        // ── Step 3: National-level records (aggregated from all provinces) ──────
        console.log("🇵🇰  Processing national totals...");

        let natInserted = 0;
        const nationalTotals = {};
        CROP_CODES.forEach(c => { nationalTotals[c] = { production: 0, consumption: 0 }; });

        for (const provinceTotalData of Object.values(provinceTotals)) {
            for (const cropCode of CROP_CODES) {
                nationalTotals[cropCode].production  += provinceTotalData[cropCode].production;
                nationalTotals[cropCode].consumption += provinceTotalData[cropCode].consumption;
            }
        }

        for (const cropCode of CROP_CODES) {
            const cropType = cropMap[cropCode];
            if (!cropType) continue;

            const { production, consumption } = nationalTotals[cropCode];
            if (production === 0 && consumption === 0) continue;

            const calc = calculateSurplusDeficit(production, consumption);

            await SurplusDeficit.findOneAndUpdate(
                { year: DATA_YEAR, level: "national", cropCode },
                {
                    year:                    DATA_YEAR,
                    level:                   "national",
                    cropType:                cropType._id,
                    cropCode,
                    production,
                    consumption,
                    balance:                 calc.balance,
                    status:                  calc.status,
                    severity:                calc.severity,
                    surplusDeficitPercentage: calc.surplusDeficitPercentage,
                    selfSufficiencyRatio:    calc.selfSufficiencyRatio,
                    requiresIntervention:    calc.requiresIntervention,
                    dataSource:              "MNFSR_Official",
                    calculatedAt:            new Date(),
                },
                { upsert: true, new: true }
            );

            natInserted++;
        }

        console.log(`   ✅ National done: ${natInserted} records\n`);

        // ── Summary ─────────────────────────────────────────────────────────────
        console.log("═══════════════════════════════════════════════════");
        console.log("  SEEDING COMPLETE");
        console.log("═══════════════════════════════════════════════════");
        console.log(`  District records:   ${distInserted}`);
        console.log(`  Provincial records: ${provInserted}`);
        console.log(`  National records:   ${natInserted}`);
        console.log(`  Total:              ${distInserted + provInserted + natInserted}`);
        console.log(`  Data source:        MNFSR Official 2024-25`);
        console.log("═══════════════════════════════════════════════════\n");

        // Quick sanity check — print a few key provincial numbers
        console.log("📊 Provincial wheat summary (production vs consumption):");
        for (const [provCode, totals] of Object.entries(provinceTotals)) {
            const w = totals["WHEAT"];
            if (w.production === 0 && w.consumption === 0) continue;
            const calc = calculateSurplusDeficit(w.production, w.consumption);
            const bar = calc.status === "surplus" ? "✅" : calc.status === "deficit" ? "❌" : "➖";
            console.log(
                `  ${bar} ${provCode.padEnd(4)}  prod: ${Math.round(w.production / 1000).toLocaleString().padStart(8)} kt` +
                `  cons: ${Math.round(w.consumption / 1000).toLocaleString().padStart(8)} kt` +
                `  ${calc.status} (${calc.surplusDeficitPercentage > 0 ? "+" : ""}${calc.surplusDeficitPercentage}%)`
            );
        }
        console.log();

    } catch (error) {
        console.error(`❌ Seeding failed: ${error.message}`);
        throw error;
    }
};

import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// Load env if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    dotenv.config();
}

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/cropconnect";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    mongoose
        .connect(MONGODB_URI)
        .then(async () => {
            console.log(`Connected to MongoDB: ${MONGODB_URI}\n`);
            await seedSurplusDeficit();
            await mongoose.disconnect();
            process.exit(0);
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err.message);
            process.exit(1);
        });
}

export default seedSurplusDeficit;

