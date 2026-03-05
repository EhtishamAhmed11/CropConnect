// Backend/seeds/06-predictions.seed.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import YieldPrediction from "../models/yieldPrediction.model.js";
import ModelPerformance from "../models/modelPerformance.model.js";
import CropType from "../models/cropType.model.js";
import Province from "../models/province.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREDICTIONS_CSV = path.join(__dirname, "../model_files/future_predictions_optimized.csv");
const PERFORMANCE_CSV = path.join(__dirname, "../model_files/model_performance_summary_optimized.csv");

const REGION_TO_PROVINCE = {
    Punjab: "PB",
    Sindh: "SD",
    KPK: "KP",
    Balochistan: "BA",
    Pakistan: null,
};

const importModelPerformance = async () => {
    console.log("📊 Seeding Model Performance Data...");
    const performances = [];

    if (!fs.existsSync(PERFORMANCE_CSV)) {
        console.warn(`⚠️ Warning: ${PERFORMANCE_CSV} not found. Skipping.`);
        return;
    }

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
                    await ModelPerformance.deleteMany({});
                    await ModelPerformance.insertMany(performances);
                    console.log(`✅ Successfully seeded ${performances.length} performance records`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on("error", reject);
    });
};

const importPredictions = async () => {
    console.log("🔮 Seeding Yield Predictions...");
    const predictions = [];

    if (!fs.existsSync(PREDICTIONS_CSV)) {
        console.warn(`⚠️ Warning: ${PREDICTIONS_CSV} not found. Skipping.`);
        return;
    }

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
                    await YieldPrediction.deleteMany({});

                    // Enrich with references
                    for (const pred of predictions) {
                        const cropType = await CropType.findOne({
                            name: { $regex: new RegExp(`^${pred.crop}$`, "i") }
                        });
                        if (cropType) pred.cropType = cropType._id;

                        if (pred.region !== "Pakistan") {
                            const provinceCode = REGION_TO_PROVINCE[pred.region];
                            const province = await Province.findOne({ code: provinceCode });
                            if (province) pred.province = province._id;
                        }
                    }

                    await YieldPrediction.insertMany(predictions);
                    console.log(`✅ Successfully seeded ${predictions.length} yield predictions`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on("error", reject);
    });
};

const seedPredictions = async () => {
    try {
        await importModelPerformance();
        await importPredictions();
        return { success: true };
    } catch (error) {
        console.error("❌ Prediction seeding failed:", error.message);
        throw error;
    }
};

export default seedPredictions;
