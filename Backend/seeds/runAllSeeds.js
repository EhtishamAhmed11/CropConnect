import seedCropTypes from "./03-cropTypes.seed.js";
import seedDistricts from "./02-districts.seed.js";
import seedProvinces from "./01-provinces.seed.js";
import seedSurplusDeficit from "./04-surplusDeficit.seed.js";
import seedMarketData from "./market.seed.js";
import seedWeather from "./05-weather.seed.js";
import seedTollRates from "./tollRates.seed.js";
import seedPredictions from "./06-predictions.seed.js";
import connectDb from "../connection/db.connection.js";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import process from "process";
import dotenv from "dotenv";

dotenv.config();

const runAllSeeds = async () => {
  try {
    console.log("🚀 Starting Complete Database Seeding Process...");
    console.log("");

    // Connect to database
    await connectDb();

    const startTime = Date.now();

    console.log("📍 STEP 1/4: Seeding Provinces");
    console.log("─".repeat(50));
    await seedProvinces();
    console.log("");

    console.log("🗺️  STEP 2/4: Seeding Districts");
    console.log("─".repeat(50));
    await seedDistricts();
    console.log("");

    console.log("🌾 STEP 3/4: Seeding Crop Types");
    console.log("─".repeat(50));
    await seedCropTypes();
    console.log("");

    console.log("📊 STEP 4/4: Seeding Surplus/Deficit Data");
    console.log("─".repeat(50));
    await seedSurplusDeficit();
    console.log("");

    console.log("📈 STEP 5/5: Seeding Market Prices");
    console.log("─".repeat(50));
    await seedMarketData();
    console.log("");

    console.log("🌦️ STEP 6/8: Seeding Weather Data");
    console.log("─".repeat(50));
    await seedWeather();
    console.log("");

    console.log("🛣️ STEP 7/8: Seeding Toll Rates");
    console.log("─".repeat(50));
    await seedTollRates();
    console.log("");

    console.log("🤖 STEP 8/8: Seeding AI Predictions");
    console.log("─".repeat(50));
    await seedPredictions();
    console.log("");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("═".repeat(50));
    console.log("✅ ALL SEEDS COMPLETED SUCCESSFULLY!");
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log("═".repeat(50));

    // Disconnect from database
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Only run if executed directly script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllSeeds();
}

export default runAllSeeds;