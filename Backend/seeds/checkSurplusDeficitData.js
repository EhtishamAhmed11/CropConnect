import mongoose from "mongoose";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import dotenv from "dotenv";

dotenv.config();

const checkSurplusDeficitData = async () => {
    try {
        console.log("🔍 Checking Surplus/Deficit Data...\n");

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Count total records
        const totalCount = await SurplusDeficit.countDocuments();
        console.log(`📊 Total Records: ${totalCount}\n`);

        if (totalCount === 0) {
            console.log("❌ NO DATA FOUND! The seeding did not complete successfully.");
            console.log("Please run the seeder again.\n");
            await mongoose.disconnect();
            process.exit(1);
        }

        // Check by year
        const years = await SurplusDeficit.distinct("year");
        console.log(`📅 Years: ${years.join(", ")}\n`);

        // Check by crop
        const crops = await SurplusDeficit.distinct("cropCode");
        console.log(`🌾 Crops: ${crops.join(", ")}\n`);

        // Check by level
        const districtCount = await SurplusDeficit.countDocuments({ level: "district" });
        const provinceCount = await SurplusDeficit.countDocuments({ level: "provincial" });
        console.log(`🗺️  District-level records: ${districtCount}`);
        console.log(`🗺️  Province-level records: ${provinceCount}\n`);

        // Sample data for 2024-01 WHEAT at district level
        const sampleData = await SurplusDeficit.find({
            year: "2024-01",
            cropCode: "WHEAT",
            level: "district"
        })
            .populate("district", "name code")
            .limit(5)
            .lean();

        if (sampleData.length > 0) {
            console.log("📝 Sample Records (2024-01, WHEAT, District):");
            sampleData.forEach((record, i) => {
                console.log(`\n  ${i + 1}. ${record.district?.name || record.districtCode}`);
                console.log(`     Status: ${record.status}`);
                console.log(`     Production: ${record.production?.toLocaleString()} tons`);
                console.log(`     Consumption: ${record.consumption?.toLocaleString()} tons`);
                console.log(`     Balance: ${record.balance?.toLocaleString()} tons`);
            });
        }

        console.log("\n✅ Data verification complete!");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

checkSurplusDeficitData();
