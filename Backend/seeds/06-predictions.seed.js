// Backend/seeds/06-predictions.seed.js
// Seeds yield predictions (with CI), model performance, and actual-vs-predicted
// from the v3.2 ML model output CSVs.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import YieldPrediction from "../models/yieldPrediction.model.js";
import ModelPerformance from "../models/modelPerformance.model.js";
import ActualVsPredicted from "../models/actualVsPredicted.model.js";
import CropType from "../models/cropType.model.js";
import Province from "../models/province.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CSV paths (v3.2 outputs) ──────────────────────────────────────────────────
const PREDICTIONS_CSV    = path.join(__dirname, "../model_files/future_predictions_v32.csv");
const PERFORMANCE_CSV    = path.join(__dirname, "../model_files/model_performance_summary_v32.csv");
const ACTUAL_VS_PRED_CSV = path.join(__dirname, "../model_files/actual_vs_predicted_v32.csv");

const REGION_TO_PROVINCE_CODE = {
    Punjab:      "PB",
    Sindh:       "SD",
    KPK:         "KP",
    Balochistan: "BA",
    Pakistan:    null,
};

// ── Helper: parse a CSV file into an array of row objects ────────────────────
const readCsv = (filePath) =>
    new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  CSV not found, skipping: ${filePath}`);
            return resolve([]);
        }
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve(rows))
            .on("error", reject);
    });

// ── 1. Model Performance ─────────────────────────────────────────────────────
const importModelPerformance = async () => {
    console.log("📊 Seeding Model Performance Data...");
    const rows = await readCsv(PERFORMANCE_CSV);
    if (!rows.length) return;

    const docs = rows.map((r) => ({
        crop:      r.Crop.trim(),
        region:    r.Region.trim(),
        bestModel: r.Best_Model.trim(),
        testR2:    parseFloat(r.Test_R2),
        cvR2:      parseFloat(r.CV_R2),
        testRMSE:  parseFloat(r.Test_RMSE),
        testMAE:   parseFloat(r.Test_MAE),
        mape:      parseFloat(r.MAPE),
    }));

    await ModelPerformance.deleteMany({});
    await ModelPerformance.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} model performance records`);
};

// ── 2. Future Predictions (with Confidence Intervals) ───────────────────────
const importPredictions = async () => {
    console.log("🔮 Seeding Yield Predictions (v3.2 with CI)...");
    const rows = await readCsv(PREDICTIONS_CSV);
    if (!rows.length) return;

    // Pre-load lookup maps for CropType and Province refs
    const cropTypes = await CropType.find({}).lean();
    const provinces = await Province.find({}).lean();

    const cropTypeMap = {};
    cropTypes.forEach((ct) => {
        cropTypeMap[ct.name.toLowerCase()] = ct._id;
    });

    const provinceMap = {};
    provinces.forEach((p) => {
        if (p.code) provinceMap[p.code] = p._id;
    });

    const docs = rows.map((r) => {
        const crop   = r.Crop.trim();
        const region = r.Region.trim();
        const doc = {
            crop,
            region,
            year: parseInt(r.Year),
            predictedProduction: {
                value: parseFloat(r.Predicted_Production_kt),
                unit:  "thousand tonnes",
            },
            confidenceInterval: {
                lower80: parseFloat(r.Lower_80_kt)  || null,
                upper80: parseFloat(r.Upper_80_kt)  || null,
                lower95: parseFloat(r.Lower_95_kt)  || null,
                upper95: parseFloat(r.Upper_95_kt)  || null,
            },
            forecastWeather: {
                rainfallMm: parseFloat(r.Forecast_Rainfall_mm) || null,
                tempC:      parseFloat(r.Forecast_Temp_C)      || null,
            },
            modelType: r.Model.trim(),
            modelR2:   parseFloat(r.Model_R2),
        };

        // Attach ObjectId references if found
        if (cropTypeMap[crop.toLowerCase()]) {
            doc.cropType = cropTypeMap[crop.toLowerCase()];
        }
        const provCode = REGION_TO_PROVINCE_CODE[region];
        if (provCode && provinceMap[provCode]) {
            doc.province = provinceMap[provCode];
        }

        return doc;
    });

    await YieldPrediction.deleteMany({});
    await YieldPrediction.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} yield predictions`);
};

// ── 3. Actual vs Predicted (test-set backtest results) ───────────────────────
const importActualVsPredicted = async () => {
    console.log("📈 Seeding Actual vs Predicted (backtest results)...");
    const rows = await readCsv(ACTUAL_VS_PRED_CSV);
    if (!rows.length) return;

    const docs = rows.map((r) => ({
        crop:                r.Crop.trim(),
        region:              r.Region.trim(),
        year:                parseInt(r.Year),
        actualProduction:    parseFloat(r.Actual_Production_kt),
        predictedProduction: parseFloat(r.Predicted_Production_kt),
        errorKt:             parseFloat(r.Error_kt),
        errorPct:            parseFloat(r.Error_Pct),
    }));

    await ActualVsPredicted.deleteMany({});
    await ActualVsPredicted.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} actual-vs-predicted records`);
};

// ── Main export ───────────────────────────────────────────────────────────────
const seedPredictions = async () => {
    try {
        await importModelPerformance();
        await importPredictions();
        await importActualVsPredicted();
        console.log("✅ All prediction data seeded successfully");
        return { success: true };
    } catch (error) {
        console.error("❌ Prediction seeding failed:", error.message);
        throw error;
    }
};

export default seedPredictions;
