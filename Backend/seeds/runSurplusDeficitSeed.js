import seedSurplusDeficit from "./04-surplusDeficit.seed.js";
import connectDb from "../connection/db.connection.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const runSurplusDeficitSeed = async () => {
    try {
        console.log("🚀 Starting Surplus/Deficit Data Seeding...");
        console.log("");

        // Connect to database
        await connectDb();

        const startTime = Date.now();

        console.log("📊 Seeding Surplus/Deficit Data");
        console.log("─".repeat(50));
        await seedSurplusDeficit();
        console.log("");

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("═".repeat(50));
        console.log("✅ SURPLUS/DEFICIT SEEDING COMPLETED!");
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

runSurplusDeficitSeed();
