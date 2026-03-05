// Backend/scripts/importPredictions.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import YieldPrediction from "../models/yieldPrediction.model.js";
import ModelPerformance from "../models/modelPerformance.model.js";
import CropType from "../models/cropType.model.js";
import Province from "../models/province.model.js";

// Load .env from root directory
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREDICTIONS_CSV = path.join(__dirname, "../model_files/future_predictions_optimized.csv");
const PERFORMANCE_CSV = path.join(__dirname, "../model_files/model_performance_summary_optimized.csv");

// Helper to map region names to province codes
const REGION_TO_PROVINCE = {
    Punjab: "PB",
    Sindh: "SD",
    KPK: "KP",
    Balochistan: "BA",
    Pakistan: null, // National level
};

async function importModelPerformance() {
    console.log("📊 Importing Model Performance Data...");

    const performances = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(PERFORMANCE_CSV)
            .pipe(csv())
            .on("data", (row) => {
                performances.push({
                    crop: row.Crop,
                    region: row.Region,
                    bestModel: row.Best_Model,
                    testR2: parseFloat(row.Test_R2),
                    cvR2: parseFloat(row.CV_R2),
                    testRMSE: parseFloat(row.Test_RMSE),
                    testMAE: parseFloat(row.Test_MAE),
                    mape: parseFloat(row.MAPE),
                });
            })
            .on("end", async () => {
                try {
                    // Clear existing data
                    await ModelPerformance.deleteMany({});

                    // Insert new data
                    await ModelPerformance.insertMany(performances);
                    console.log(`✅ Imported ${performances.length} model performance records`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on("error", reject);
    });
}

async function importPredictions() {
    console.log("🔮 Importing Yield Predictions...");

    const predictions = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(PREDICTIONS_CSV)
            .pipe(csv())
            .on("data", (row) => {
                predictions.push({
                    crop: row.Crop,
                    region: row.Region,
                    year: parseInt(row.Year),
                    predictedProduction: {
                        value: parseFloat(row.Predicted_Production),
                        unit: "thousand tonnes",
                    },
                    modelType: row.Model,
                    modelR2: parseFloat(row.Model_R2),
                });
            })
            .on("end", async () => {
                try {
                    // Clear existing predictions
                    await YieldPrediction.deleteMany({});

                    // Enrich with references
                    for (const pred of predictions) {
                        // Find matching crop type
                        const cropType = await CropType.findOne({
                            name: pred.crop.toUpperCase()
                        });
                        if (cropType) {
                            pred.cropType = cropType._id;
                        }

                        // Find matching province (if not Pakistan-level)
                        if (pred.region !== "Pakistan") {
                            const provinceCode = REGION_TO_PROVINCE[pred.region];
                            const province = await Province.findOne({ code: provinceCode });
                            if (province) {
                                pred.province = province._id;
                            }
                        }
                    }

                    // Insert predictions
                    await YieldPrediction.insertMany(predictions);
                    console.log(`✅ Imported ${predictions.length} yield predictions`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on("error", reject);
    });
}

import * as AlertService from "../services/alert.service.js";

// ... (previous code)

async function main() {
    let ingestionLogId = null;
    try {
        console.log("🚀 Starting Prediction Data Import...\n");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // 1. Log Ingestion Start
        ingestionLogId = await AlertService.logIngestionStart("Batch Script", "Yield Predictions (ML)");

        // Import data
        await importModelPerformance();
        await importPredictions();

        console.log("\n🎉 All prediction data imported successfully!");

        // 2. Log Ingestion Success
        await AlertService.logIngestionEnd(ingestionLogId, "completed", 166); // approx count (151 pred + 15 perf)

        process.exit(0);
    } catch (error) {
        console.error("❌ Error importing predictions:", error);

        // 3. Log Ingestion Failure & Create Alert
        if (ingestionLogId) {
            await AlertService.logIngestionEnd(ingestionLogId, "failed", 0, error);
            await AlertService.createSystemAlert(
                "Prediction Import Failed",
                `ML Prediction import failed: ${error.message}`,
                "high"
            );
        }

        process.exit(1);
    }
}

main();
