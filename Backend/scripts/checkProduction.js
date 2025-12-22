import mongoose from "mongoose";
import ProductionData from "../models/productionData.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";

// Connect to MongoDB
const MONGODB_URI = "mongodb://localhost:27017/cropconnect"; // Adjust if needed

const checkData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const count = await ProductionData.countDocuments();
        console.log(`Total Production Records: ${count}`);

        if (count === 0) {
            console.log("No production data found.");
            return;
        }

        // Check one record
        const sample = await ProductionData.findOne().populate('province district cropType');
        console.log("Sample Record:", JSON.stringify(sample, null, 2));

        // Check for broken references
        const brokenProvinces = await ProductionData.countDocuments({ level: 'provincial', province: null });
        console.log(`Records with missing province ref (but level=provincial): ${brokenProvinces}`);

        // Check specific query failing for user
        // Year: "2024-25", Crop: "WHEAT", Level "provincial" or "national"
        const specific = await ProductionData.findOne({ year: "2024-25", cropCode: "WHEAT" }).populate('province');
        console.log("Query '2024-25' 'WHEAT':", specific ? "Found" : "Not Found");
        if (specific) {
            console.log("Specific Record Province:", specific.province);
        }

        // Check distinct years
        const years = await ProductionData.distinct('year');
        console.log("Available Years:", years);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
