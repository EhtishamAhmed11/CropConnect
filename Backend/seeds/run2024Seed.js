import seed2024Data from "./2024_25_data.seed.js";
import connectDb from "../connection/db.connection.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run2024Seed = async () => {
    try {
        console.log("🚀 Starting 2024-25 Data Seeding...");
        console.log("");

        // Connect to database
        await connectDb();

        const startTime = Date.now();

        await seed2024Data();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("═".repeat(50));
        console.log("✅ 2024-25 SEEDING COMPLETED!");
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

run2024Seed();
