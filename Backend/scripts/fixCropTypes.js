import mongoose from "mongoose";
import ProductionData from "../models/productionData.model.js";
import CropType from "../models/cropType.model.js";
import connectDb from "../connection/db.connection.js";
import "dotenv/config";

export const fixCropTypes = async () => {
    try {
        await connectDb();
        console.log("Connected to DB to fix crop types...");

        const crops = await CropType.find({});
        const cropMap = {};
        crops.forEach(c => {
            cropMap[c.code] = c._id;
        });

        console.log("Available Crops:", Object.keys(cropMap));

        const productions = await ProductionData.find({});
        console.log(`Checking ${productions.length} production records...`);

        let updated = 0;

        for (const prod of productions) {
            if (!prod.cropCode) continue;

            const correctId = cropMap[prod.cropCode];
            if (correctId) {
                // Check if update is needed (if id is missing or different)
                if (!prod.cropType || prod.cropType.toString() !== correctId.toString()) {
                    prod.cropType = correctId;
                    await prod.save();
                    updated++;
                }
            } else {
                console.log(`Warning: No CropType found for code ${prod.cropCode} in record ${prod._id}`);
            }
        }

        console.log(`✅ successfully updated ${updated} records with correct CropType references.`);
        process.exit(0);
    } catch (error) {
        console.error("Error fixing crop types:", error);
        process.exit(1);
    }
};

